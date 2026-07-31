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
      className="flex items-center gap-[22px] rounded-[22px] border border-[var(--atlas-glass-border)] bg-[var(--atlas-glass)] p-[22px] shadow-[0_24px_60px_rgba(0,0,0,.45)]"
    >
      <div
        role="img"
        aria-label={t('qr.ariaLabel', { url: joinUrl })}
        className="h-[175px] w-[175px] flex-none rounded-[14px] bg-white p-3 shadow-[0_6px_18px_rgba(0,0,0,.3)] [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      <div className="min-w-0">
        <div className="font-display text-[26px] leading-[1.1] font-extrabold text-fg">{t('qr.scanToJoin')}</div>
        <div className="mt-[10px] truncate font-mono text-[16px] text-fg-muted">{joinUrl}</div>
        <span className="mt-3 inline-block rounded-[10px] bg-pitch-500 px-4 py-1.5 font-mono text-[24px] font-semibold tracking-[.18em] text-[var(--on-pitch)]">
          {gameId}
        </span>
      </div>
    </div>
  )
}
