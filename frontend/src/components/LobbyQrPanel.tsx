import { useTranslation } from 'react-i18next'
import { QrCodePanel } from './ui/QrCodePanel'

export interface LobbyQrPanelProps {
  gameId: string
  origin?: string
}

/**
 * QR-code + code om te joinen (FO §2.1/§3, TV-scherm). QR encodeert /play/:gameId —
 * dezelfde route als de handmatig ingevoerde code, dus scannen en overtypen komen op
 * hetzelfde uit.
 */
export function LobbyQrPanel({ gameId, origin = window.location.origin }: LobbyQrPanelProps) {
  const { t } = useTranslation('lobby')
  const joinUrl = `${origin}/play/${gameId}`

  return (
    <QrCodePanel
      url={joinUrl}
      code={gameId}
      title={t('qr.scanToJoin')}
      ariaLabel={t('qr.ariaLabel', { url: joinUrl })}
    />
  )
}
