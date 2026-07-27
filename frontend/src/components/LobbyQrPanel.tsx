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
    <div
      className="flex w-[560px] flex-none flex-col items-center justify-center rounded-sheet border border-border-strong p-9 shadow-[0_30px_80px_rgba(0,0,0,.5)]"
      style={{ background: 'linear-gradient(#131c2b,#0d1420)' }}
    >
      <div
        role="img"
        aria-label={t('qr.ariaLabel', { url: joinUrl })}
        className="w-[360px] rounded-[18px] border-[3px] border-[var(--silver)] bg-white p-6 [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      <p className="mt-[26px] font-display text-[30px] font-extrabold">{t('qr.scanToJoin')}</p>
      <div className="mt-4 flex items-center gap-3.5">
        <span className="font-mono text-[18px] text-fg-muted">{joinUrl}</span>
        <span className="rounded-[10px] bg-pitch-400 px-4 py-1.5 font-mono text-[26px] font-semibold tracking-[.18em] text-[#04060b]">
          {gameId}
        </span>
      </div>
    </div>
  )
}
