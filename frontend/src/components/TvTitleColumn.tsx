import type { CSSProperties } from 'react'
import { tvAnimations } from '../styles/motion'
import {
  glassBadgeBorder,
  glassBlur,
  glassSaturate,
  glassSurface,
  glassSurfaceOpaque,
  scaleGlassSurfaceAlpha,
} from '../styles/glass-tokens'
import { useTvDisplayScale } from '../hooks/useTvDisplayScale'

export interface TvTitleColumnProps {
  /** Glas-kicker boven de titel, bv. "Wachtkamer". */
  badge: string
  /** Wachtregel onderaan met de pulserende stip. */
  status: string
}

/**
 * Linkerkolom van de TV-wachtschermen (lobby en "TV koppelen"): kicker, OPERATIE ATLAS-titel bij
 * het kasteel en een wachtregel onderaan. Vult de ruimte naast de rechter glas-rail.
 */
export function TvTitleColumn({ badge, status }: TvTitleColumnProps) {
  // De kicker-badge is glas buiten `GlassPanel` om; volgt dezelfde TV-glasinstelling (plan-testronde-tv punt 2).
  const scale = useTvDisplayScale()

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span
        className="glass-panel self-start rounded-chip px-[18px] py-[9px] font-body text-h3 font-extrabold tracking-[.16em] text-[#c2cddd] uppercase"
        data-glass-filter="on"
        style={
          {
            '--glass-bg': scaleGlassSurfaceAlpha(glassSurface.raised, scale.glassOpacity),
            '--glass-bg-opaque': glassSurfaceOpaque.raised,
            '--glass-border': glassBadgeBorder,
            '--glass-filter': `blur(${Math.round(glassBlur.sm * scale.glassBlur)}px) saturate(${glassSaturate})`,
          } as CSSProperties
        }
      >
        {badge}
      </span>
      <div className="mt-[26px]">
        <div className="font-display text-size14 leading-[.92] font-black tracking-[-.01em] text-[#f7f9fc] [text-shadow:0_6px_40px_rgba(4,6,11,.9),0_2px_8px_rgba(4,6,11,.8)]">
          OPERATIE
        </div>
        <div className="font-display text-size14 leading-[.92] font-black tracking-[-.01em] text-[#f7f9fc] [text-shadow:0_6px_40px_rgba(4,6,11,.9),0_2px_8px_rgba(4,6,11,.8)]">
          ATLAS
        </div>
      </div>
      <div className="mt-[26px] flex items-center gap-4">
        <span className="inline-block h-[5px] w-16 rounded-full bg-pitch-500" />
        <span className="font-body text-size4 tracking-[.14em] text-[rgba(247,249,252,.82)] [text-shadow:0_2px_12px_rgba(4,6,11,.9)]">
          CAMPAGNE-TERMINAL
        </span>
      </div>
      <div className="mt-auto flex items-center gap-3 font-body text-size3 text-[rgba(247,249,252,.72)] [text-shadow:0_2px_12px_rgba(4,6,11,.9)]">
        <span
          className="h-3 w-3 rounded-full bg-pitch-500 shadow-[0_0_14px_rgba(161,194,58,.8)]"
          style={{ animation: tvAnimations.waitingDot }}
        />
        {status}
      </div>
    </div>
  )
}
