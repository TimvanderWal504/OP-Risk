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
  className="flex flex-1 min-w-0 flex-col items-center justify-center rounded-sheet border border-border-strong p-6 max-w-[450px] shadow-[0_30px_80px_rgba(0,0,0,.5)]"
  style={{ background: 'linear-gradient(#131c2b,#0d1420)' }}
>
  <div
    role="img"
    aria-label={t('qr.ariaLabel', { url: joinUrl })}
    className="w-full max-w-[280px] aspect-square rounded-[18px] border-[3px] border-[var(--silver)] bg-white p-4 [&_svg]:h-full [&_svg]:w-full"
    dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
  />
  <p className="mt-4 font-display text-[22px] xl:text-[30px] font-extrabold text-center">{t('qr.scanToJoin')}</p>
  <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-2.5">
    <span className="truncate font-mono text-[14px] xl:text-[18px] text-fg-muted">{joinUrl}</span>
    <span className="rounded-[10px] bg-pitch-400 px-3 py-1 font-mono text-[20px] xl:text-[26px] font-semibold tracking-[.18em] text-[#04060b]">
      {gameId}
    </span>
  </div>
</div>
  )
}
