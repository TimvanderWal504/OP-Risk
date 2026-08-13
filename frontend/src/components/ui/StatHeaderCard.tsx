import type { ReactNode } from 'react'
import { GlassPanel } from './GlassPanel'

export interface StatHeaderCardProps {
  title: string
  statValue: number | string
  statLabel: string
  /** Verticale padding in px — 11 bij Claim (L396), 12 bij Startopstelling/Versterken (L453). */
  paddingY: 11 | 12
  /** Randkleur — `silver` (Claim/Startopstelling) of `pitch` (Versterken, volgt de speler-/legerkleur). */
  accentColor?: 'silver' | 'pitch'
  /**
   * Uitlegregel onder de titel/teller-rij, binnen hetzelfde paneel. Optioneel: alleen
   * Startopstelling heeft er vandaag een. Stond daar tot 2026-08-13 als eigen glas-chip
   * eronder — twee panelen voor één kop, zie de doc-comment hieronder.
   */
  hint?: ReactNode
}

const PADDING_Y = {
  11: 'py-[11px]',
  12: 'py-3',
} as const

/**
 * Alleen nog de randkleur. De teller had hier tot 2026-08-13 een eigen accentkleur
 * (`text-silver-300`/`text-pitch-300`) en droeg daarmee als enige element van de kaart een
 * derde kleur; op verzoek van de gebruiker volgt hij nu de titel (`--fg`). De spelerskleur —
 * het alternatief dat de gebruiker openliet — is bewust niet gekozen: die is er niet voor alle
 * drie de consumenten (Claim telt vrije gebieden, niet iets van één speler), en de solide
 * `--player-*`-waarden zijn getuned als vulkleur, niet als tekst op donker glas (blauw
 * `#0057ff` en paars halen daar geen leesbaar contrast).
 */
const ACCENT = {
  silver: 'var(--silver-700)',
  pitch: 'var(--pitch-700)',
} as const

/**
 * Kop met titel links en een teller + label naast elkaar rechts (`isClaim/claimMine`-,
 * `isSetup`- en `isReinf`-substaten in het oorspronkelijke design) — identiek op layout,
 * gradient en radius voor alle drie schermen; alleen de verticale padding en accentkleur
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
      // BEVINDING, opgelost (2026-08-10): achtergrond faded van 14% alpha naar 0% — rechts, waar
      // statValue/statLabel staan, was dus letterlijk GEEN achtergrond. Buiten de destijds
      // gemigreerde componenten, dus gemist door die eerdere tokenfix.
      className={`rounded-[14px] px-3.5 ${PADDING_Y[paddingY]}`}
      style={{ borderColor }}
    >
      {/* De titel/teller-rij was tot 2026-08-13 het paneel zelf; nu een rij binnen het paneel,
          zodat `hint` eronder in hetzelfde glas past i.p.v. in een tweede chip eronder. */}
      <div className="flex items-center justify-between">
        {/* Geen eigen marge meer op de titel: die zette 'm 8px verder naar binnen dan de
            hint eronder, dus de twee tekstblokken begonnen niet op dezelfde lijn. De rijhoogte
            verandert er niet merkbaar door — die wordt gezet door de 34px-teller ernaast. */}
        <div className="min-w-0">
          <div className="font-display text-h2 font-extrabold">{title}</div>
        </div>
        <div className="flex flex-none flex-row items-end gap-2">
          <div className="font-display text-[34px] leading-none font-black text-fg">{statValue}</div>
          <div className="font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted">{statLabel}</div>
        </div>
      </div>
      {/* Typografie van de ondertitel op OrderRollWaitStep (`text-body`/`text-fg-muted`, geen
          extra letterafstand) i.p.v. de 16px + `tracking-[.1em]` die deze regel overhield aan zijn
          tijd als losse chip — een hele zin op chip-letterafstand leest als een label, niet als
          uitleg. Op verzoek van de gebruiker (2026-08-13). */}
      {hint && <div className="mt-3 font-body text-body text-fg-muted">{hint}</div>}
    </GlassPanel>
  )
}
