import { useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import type { GameStateDto } from '../types/GameState'

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

  useEffect(() => {
    if (!connection || connectionState !== HubConnectionState.Connected) return

    let cancelled = false

    connection
      .invoke<GameStateDto>('WatchGame', gameId)
      .then((initial) => {
        if (!cancelled) setState(initial)
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

  return { state, connectionState, error }
}
