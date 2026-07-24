import { useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import type { GameStateDto } from '../types/GameState'
import type { DiceRolledMessage } from '../types/HubResponses'

/**
 * TV-kant van de lobby-flow: roept eenmalig WatchGame(gameId) aan zodra de verbinding
 * open is (de enige aanroep die de TV doet na het handmatig navigeren naar
 * /tv/:gameId — zie het bouwplan), en abonneert daarna puur op "GameStateUpdated".
 * Geen polling: elke wijziging komt via de group-broadcast in GameHub binnen.
 */
export function useTvGame(gameId: string) {
  const { connection, connectionState } = useSignalR()
  const [state, setState] = useState<GameStateDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderRollThrows, setOrderRollThrows] = useState<Record<string, number[]>>({})

  // Negeert stale snapshots/broadcasts: een WatchGame-respons die terugkomt ná een
  // nieuwere GameStateUpdated (of vice versa) mag de nieuwere state niet overschrijven.
  const applyState = (next: GameStateDto) => {
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

  useEffect(() => {
    if (!connection || connectionState !== HubConnectionState.Connected) return

    let cancelled = false

    connection
      .invoke<GameStateDto>('WatchGame', gameId)
      .then((initial) => {
        if (!cancelled) {
          applyState(initial)
          setError(null)
        }
      })
      .catch((watchError: unknown) => {
        if (!cancelled) {
          setError(watchError instanceof Error ? watchError.message : String(watchError))
        }
      })

    return () => {
      cancelled = true
    }
  }, [connection, connectionState, gameId])

  return { state, connectionState, error, orderRollThrows }
}