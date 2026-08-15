import type { ReactNode } from 'react'
import { GlassPanel } from './GlassPanel'

export interface StatHeaderCardProps {
  title: string
  statValue: number | string
  statLabel: string
  /** Verticale padding in px — 11 bij Claim, 12 bij Startopstelling/Versterken. */
  paddingY: 11 | 12
  /** Randkleur — `silver` (Claim/Startopstelling) of `pitch` (Versterken, volgt de speler-/legerkleur). */
  accentColor?: 'silver' | 'pitch'
  /** Uitlegregel onder de titel/teller-rij, binnen hetzelfde paneel. Optioneel: alleen
   *  Startopstelling heeft er vandaag een. */
  hint?: ReactNode
}

const PADDING_Y = {
  11: 'py-[11px]',
  12: 'py-3',
} as const

/**
 * Alleen de randkleur draagt een accent; de teller zelf volgt de titelkleur (`--fg`), geen derde
 * kleur op de kaart. Spelerskleur is bewust niet gebruikt: niet elke consument heeft een eigen
 * speler (Claim telt vrije gebieden), en de solide `--player-*`-waarden zijn getuned als
 * vulkleur, niet als tekst op donker glas (blauw/paars halen daar geen leesbaar contrast).
 */
const ACCENT = {
  silver: 'var(--silver-700)',
  pitch: 'var(--pitch-700)',
} as const

/**
 * Kop met titel links en een teller + label naast elkaar rechts — identiek op layout, gradient
 * en radius voor alle schermen die 'm gebruiken; alleen verticale padding en accentkleur
 * verschillen per scherm.
 */
export function StatHeaderCard({
  title,
  statValue,
  statLabel,
  paddingY,
  accentColor = 'silver',
  hint,
}: StatHeaderCardProps) {
  const borderColor = ACCENT[accentColor]

  return (
    <GlassPanel
      elevation="base"
      context="phone"
      padding="none"
      className={`rounded-[14px] px-3.5 ${PADDING_Y[paddingY]}`}
      style={{ borderColor }}
    >
      {/* Titel/teller staat in een eigen rij binnen het paneel, zodat `hint` eronder in hetzelfde
          glas past i.p.v. in een aparte chip. */}
      <div className="flex items-center justify-between">
        {/* Geen eigen marge op de titel: zou 'm verder naar binnen zetten dan de hint eronder,
            dus niet op dezelfde lijn beginnen. Rijhoogte wordt toch gezet door de 34px-teller
            ernaast. */}
        <div className="min-w-0">
          <div className="font-display text-h2 font-extrabold">{title}</div>
        </div>
        <div className="flex flex-none flex-row items-end gap-2">
          <div className="font-display text-[34px] leading-none font-black text-fg">{statValue}</div>
          <div className="font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted">{statLabel}</div>
        </div>
      </div>
      {/* Typografie volgt de ondertitel op OrderRollWaitStep (`text-body`/`text-fg-muted`, geen
          extra letterafstand): een hele zin op chip-letterafstand (`tracking-[.1em]`) leest als
          een label, niet als uitleg. */}
      {hint && <div className="mt-3 font-body text-body text-fg-muted">{hint}</div>}
    </GlassPanel>
  )
}
