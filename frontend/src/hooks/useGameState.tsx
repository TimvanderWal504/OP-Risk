import { useCallback, useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import type { GameStateDto } from '../types/GameState'
import type { DiceRolledMessage, JoinGameResponse, OrderRollResponse } from '../types/HubResponses'

const playerIdKey = (gameId: string) => `game:${gameId}:playerId`

/**
 * Speler-kant van de lobby-flow (telefoon, FO §3): join/kleur/rol/start via de hub,
 * geabonneerd op "GameStateUpdated" zodat acties van andere spelers direct doorkomen.
 * Toont nooit voorspelde state — alleen wat de server bevestigt (frontend/CLAUDE.md).
 *
 * playerId wordt in sessionStorage bewaard en na elke (re)connect via RejoinGame
 * teruggemeld aan de hub, want SignalR-groepslidmaatschap gaat verloren bij reconnect
 * én bij page refresh (nieuwe connection-id in beide gevallen).
 */
export function useGameState(gameId: string) {
  const { connection, connectionState } = useSignalR()
  const [state, setState] = useState<GameStateDto | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(
    () => sessionStorage.getItem(playerIdKey(gameId)),
  )
  const [error, setError] = useState<string | null>(null)
  const [orderRollThrows, setOrderRollThrows] = useState<Record<string, number[]>>({})

  const persistPlayerId = useCallback(
    (id: string) => {
      sessionStorage.setItem(playerIdKey(gameId), id)
      setPlayerId(id)
    },
    [gameId],
  )

  // Negeert stale snapshots/broadcasts: een respons die terugkomt ná een nieuwere
  // GameStateUpdated (of vice versa) mag de nieuwere state niet overschrijven.
  const applyState = (next: GameStateDto) => {
    console.log(next.stateVersion, state?.stateVersion)
    setState((current) => (current && next.stateVersion <= current.stateVersion ? current : next))
  }

  useEffect(() => {
    if (!connection) return

    const onUpdate = (updated: GameStateDto) => {
      if (updated.gameId !== gameId) return

      applyState(updated)

      setOrderRollThrows((current) =>
        updated.turnOrder.length > 0 && Object.keys(current).length > 0 ? {} : current,
      )
    }

    const onDiceRolled = (message: DiceRolledMessage) => {
      if (message.context !== 'order-roll') return

      setOrderRollThrows((current) => ({ ...current, [message.playerId]: message.dice }))
    }

    connection.on('GameStateUpdated', onUpdate)
    connection.on('DiceRolled', onDiceRolled)

    return () => {
      connection.off('GameStateUpdated', onUpdate)
      connection.off('DiceRolled', onDiceRolled)
    }
  }, [connection, gameId])

  // Herstelt group-membership na elke (re)connect zodra er een bekende playerId is —
  // dekt zowel automatic-reconnect als een page refresh met sessionStorage-hit.
  useEffect(() => {
    if (!connection || connectionState !== HubConnectionState.Connected || !playerId) return

    let cancelled = false

    connection
      .invoke<GameStateDto>('RejoinGame', gameId, playerId)
      .then((fresh) => {
        if (!cancelled) {
          applyState(fresh)
          setError(null)
        }
      })
      .catch((rejoinError: unknown) => {
        if (!cancelled) {
          setError(rejoinError instanceof Error ? rejoinError.message : String(rejoinError))
        }
      })

    return () => {
      cancelled = true
    }
  }, [connection, connectionState, gameId, playerId])

  const invoke = useCallback(
    async <T,>(methodName: string, ...args: unknown[]): Promise<T | undefined> => {
      if (!connection) return undefined

      try {
        setError(null)

        return await connection.invoke<T>(methodName, ...args)
      } catch (invokeError) {
        setError(invokeError instanceof Error ? invokeError.message : String(invokeError))

        return undefined
      }
    },
    [connection],
  )

  const joinGame = useCallback(
    async (playerName: string) => {
      const response = await invoke<JoinGameResponse>('JoinGame', gameId, playerName)

      if (response) {
        persistPlayerId(response.playerId)
        applyState(response.state)
      }
    },
    [invoke, gameId, persistPlayerId],
  )

  const chooseColor = useCallback(
    async (colorId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('ChooseColor', gameId, playerId, colorId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  const selectRole = useCallback(
    async (roleId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('SelectRole', gameId, playerId, roleId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  const startGame = useCallback(async () => {
    if (!playerId) return

    const updated = await invoke<GameStateDto>('StartGame', gameId, playerId)

    if (updated) applyState(updated)
  }, [invoke, gameId, playerId])

  const rollForOrder = useCallback(async () => {
    if (!playerId) return

    const response = await invoke<OrderRollResponse>('RollForOrder', gameId, playerId)

    if (response) applyState(response.state)
  }, [invoke, gameId, playerId])

  return {
    state,
    playerId,
    connectionState,
    error,
    orderRollThrows,
    joinGame,
    chooseColor,
    selectRole,
    startGame,
    rollForOrder,
  }
}