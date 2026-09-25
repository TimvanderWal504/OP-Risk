import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { GlassPanel } from './GlassPanel'

export interface QrCodePanelProps {
  /** Wat de QR encodeert; staat ook uitgeschreven onder de titel. */
  url: string
  /** De code die bij de QR hoort, in de groene chip. */
  code: string
  title: string
  ariaLabel: string
}

/**
 * QR-code + titel + uitgeschreven url + code-chip op de TV. Gedeeld door de lobby (joinen,
 * `LobbyQrPanel`) en het koppelscherm ("TV opzetten", `TvPairPage`) — één vorm, twee adressen.
 */
export function QrCodePanel({ url, code, title, ariaLabel }: QrCodePanelProps) {
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    QRCode.toString(url, { type: 'svg', margin: 1 })
      .then((result) => {
        if (!cancelled) setSvg(result)
      })
      .catch(() => {
        if (!cancelled) setSvg(null)
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <GlassPanel elevation="base" context="tv" className="flex items-center gap-[22px]">
      <div
        role="img"
        aria-label={ariaLabel}
        className="h-[175px] w-[175px] flex-none rounded-[14px] bg-white p-3 shadow-[0_6px_18px_rgba(0,0,0,.3)] [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      <div className="min-w-0">
        <div className="font-display text-size6 leading-[1.1] font-extrabold text-fg">{title}</div>
        <div className="mt-[10px] truncate font-body text-label text-fg-muted">{url}</div>
        <span className="mt-3 inline-block rounded-[10px] bg-pitch-500 px-4 py-1.5 font-body text-size5 font-semibold tracking-[.18em] text-[var(--on-pitch)]">
          {code}
        </span>
      </div>
    </GlassPanel>
  )
}
