import { useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import type { TvPairedMessage } from '../types/HubResponses'

/** Wachttijd vóór de eerste herhaalpoging na een mislukte `RegisterTv`; verdubbelt per poging. */
export const PAIRING_RETRY_BASE_MS = 1000
/** Bovengrens van die wachttijd — zelfde plafond als het herverbinden in `GameHubProvider`. */
export const PAIRING_RETRY_MAX_MS = 30_000

/**
 * TV-kant van "TV koppelen": vraagt een koppelcode aan zodra de verbinding open is, en opnieuw na
 * elke reconnect — de code hoort bij één connectie, een nieuwe connectie heeft een nieuwe nodig.
 * Tijdens het (her)verbinden is er dus geen geldige code (`null`). Mislukt de aanvraag, dan
 * probeert de hook het zelf opnieuw met oplopende wachttijd — de TV heeft geen bediening (FO §2.1),
 * niemand kan er op "opnieuw" drukken. Zodra de host een spel stuurt, levert de hook de spelcode
 * in `pairedGameId`.
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
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const register = (attempt: number) => {
      connection
        .invoke<string>('RegisterTv')
        .then((code) => {
          if (cancelled) return
          setPairingCode(code)
          setFailed(false)
        })
        .catch(() => {
          if (cancelled) return
          setFailed(true)
          retryTimer = setTimeout(
            () => register(attempt + 1),
            Math.min(PAIRING_RETRY_BASE_MS * 2 ** attempt, PAIRING_RETRY_MAX_MS),
          )
        })
    }

    register(0)

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
    }
  }, [connection, connected])

  return { pairingCode: connected ? pairingCode : null, pairedGameId, failed }
}
