import { useCallback, useEffect, useState } from 'react'
import { useSignalR } from './useSignalR'
import type { GameStateDto } from '../types/GameState'
import type { JoinGameResponse } from '../types/HubResponses'

/**
 * Speler-kant van de lobby-flow (telefoon, FO §3): join/kleur/rol/start via de hub,
 * geabonneerd op "GameStateUpdated" zodat acties van andere spelers direct doorkomen.
 * Toont nooit voorspelde state — alleen wat de server bevestigt (frontend/CLAUDE.md).
 */
export function useGameState(gameId: string) {
  const { connection, connectionState } = useSignalR()
  const [state, setState] = useState<GameStateDto | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!connection) return

    const onUpdate = (updated: GameStateDto) => {
      if (updated.gameId === gameId) {
        setState(updated)
      }
    }

    connection.on('GameStateUpdated', onUpdate)

    return () => {
      connection.off('GameStateUpdated', onUpdate)
    }
  }, [connection, gameId])

  const invoke = useCallback(
    async <T>(methodName: string, ...args: unknown[]): Promise<T | undefined> => {
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
        setPlayerId(response.playerId)
        setState(response.state)
      }
    },
    [invoke, gameId],
  )

  const chooseColor = useCallback(
    async (colorId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('ChooseColor', gameId, playerId, colorId)

      if (updated) setState(updated)
    },
    [invoke, gameId, playerId],
  )

  const selectRole = useCallback(
    async (roleId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('SelectRole', gameId, playerId, roleId)

      if (updated) setState(updated)
    },
    [invoke, gameId, playerId],
  )

  const startGame = useCallback(async () => {
    if (!playerId) return

    const updated = await invoke<GameStateDto>('StartGame', gameId, playerId)

    if (updated) setState(updated)
  }, [invoke, gameId, playerId])

  return { state, playerId, connectionState, error, joinGame, chooseColor, selectRole, startGame }
}
