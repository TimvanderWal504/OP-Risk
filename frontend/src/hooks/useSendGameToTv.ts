import { useState } from 'react'
import { useSignalR } from './useSignalR'
import { parseHubError, translateValidationErrors } from '../i18n/hubError'

/**
 * Telefoon-kant van "TV koppelen": stuurt een spelcode naar de TV achter een gescande koppelcode.
 * `true` = de TV heeft 'm; bij `false` staat de vertaalde reden in `error`.
 */
export function useSendGameToTv() {
  const { connection } = useSignalR()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async (pairingCode: string, gameId: string): Promise<boolean> => {
    setSending(true)
    setError(null)

    try {
      await connection.invoke('SendGameToTv', pairingCode, gameId)

      return true
    } catch (sendError: unknown) {
      const message = sendError instanceof Error ? sendError.message : String(sendError)
      setError(translateValidationErrors(parseHubError(message)))

      return false
    } finally {
      setSending(false)
    }
  }

  return { send, sending, error }
}
