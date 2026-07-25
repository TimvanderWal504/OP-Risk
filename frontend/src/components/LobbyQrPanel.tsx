import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'

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
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    QRCode.toString(joinUrl, { type: 'svg', margin: 1 })
      .then((result) => {
        if (!cancelled) setSvg(result)
      })
      .catch(() => {
        if (!cancelled) setSvg(null)
      })

    return () => {
      cancelled = true
    }
  }, [joinUrl])

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-border-strong bg-surface-2 p-8">
      <div
        role="img"
        aria-label={t('qr.ariaLabel', { url: joinUrl })}
        className="w-64 rounded-card bg-white p-4 shadow-[0_0_0_6px_rgba(132,173,40,0.25)] [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      <p className="font-display text-h2 font-bold">{t('qr.scanToJoin')}</p>
      <div className="flex items-center gap-3">
        <span className="font-mono text-fg-muted">{joinUrl}</span>
        <span className="rounded-chip bg-pitch-400 px-4 py-1 font-mono text-lg font-semibold tracking-wide text-fg-onbrand">
          {gameId}
        </span>
      </div>
    </div>
  )
}
