import { useEffect, useState } from 'react'
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr'

/**
 * Verbindingsbeheer voor de GameHub (TO §6). Bouwt één HubConnection per component-boom,
 * start 'm en ruimt 'm op bij unmount. Geen spellogica hier — alleen de verbinding zelf;
 * useGameState/useTvGame roepen hub-methoden aan en verwerken de state.
 */
export function useSignalR() {
  const [connection] = useState(() =>
    new HubConnectionBuilder().withUrl('/hubs/game').withAutomaticReconnect().build(),
  )
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    HubConnectionState.Disconnected,
  )

  useEffect(() => {
    const syncState = () => setConnectionState(connection.state)
    connection.onreconnecting(syncState)
    connection.onreconnected(syncState)
    connection.onclose(syncState)

    connection.start().then(syncState).catch(syncState)

    return () => {
      void connection.stop()
    }
  }, [connection])

  return { connection, connectionState }
}
