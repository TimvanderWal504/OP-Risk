import { useState } from 'react'
import { useSignalR } from './useSignalR'
import { useToast } from './useToast'
import { parseHubError, translateValidationErrors } from '../i18n/hubError'

// Een nieuwe verzendpoging ruimt de fouttoast van de vorige op.
const sendToTvToastSource = 'sendToTv'

/**
 * Telefoon-kant van "TV koppelen": stuurt een spelcode naar de TV achter een gescande koppelcode.
 * `true` = de TV heeft 'm; bij `false` verschijnt de vertaalde reden als toast.
 */
export function useSendGameToTv() {
  const { connection } = useSignalR()
  const { showError, clearSource } = useToast()
  const [sending, setSending] = useState(false)

  const send = async (pairingCode: string, gameId: string): Promise<boolean> => {
    setSending(true)
    clearSource(sendToTvToastSource)

    try {
      await connection.invoke('SendGameToTv', pairingCode, gameId)

      return true
    } catch (sendError: unknown) {
      const message = sendError instanceof Error ? sendError.message : String(sendError)
      showError(translateValidationErrors(parseHubError(message)), sendToTvToastSource)

      return false
    } finally {
      setSending(false)
    }
  }

  return { send, sending }
}
