import { useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import type { TvPairedMessage } from '../types/HubResponses'

/**
 * TV-kant van "TV opzetten": vraagt een koppelcode aan zodra de verbinding open is, en opnieuw na
 * elke reconnect — de code hoort bij één connectie, een nieuwe connectie heeft een nieuwe nodig.
 * Tijdens het (her)verbinden is er dus geen geldige code (`null`). Zodra de host een spel stuurt,
 * levert de hook de spelcode in `pairedGameId`.
 */
export function useTvPairing() {
  const { connection, connectionState } = useSignalR()
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairedGameId, setPairedGameId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const connected = connectionState === HubConnectionState.Connected

  useEffect(() => {
    const onPaired = (message: TvPairedMessage) => setPairedGameId(message.gameId)

    connection.on('TvPaired', onPaired)

    return () => connection.off('TvPaired', onPaired)
  }, [connection])

  useEffect(() => {
    if (!connected) return

    let cancelled = false

    connection
      .invoke<string>('RegisterTv')
      .then((code) => {
        if (cancelled) return
        setPairingCode(code)
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [connection, connected])

  return { pairingCode: connected ? pairingCode : null, pairedGameId, failed }
}
