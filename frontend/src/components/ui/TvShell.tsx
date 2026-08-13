import type { ReactNode } from 'react'
import { TvStageBackground } from './TvStageBackground'
import type { StageScrimLevel } from '../../styles/glass-tokens'

export interface TvShellProps {
  children: ReactNode
  /** Scrim-intensiteit van de persistente stage-achtergrond, zie `tvScreens.resolveStageScrimLevel`. */
  scrimLevel?: StageScrimLevel
}

/**
 * TV-viewport: de stage met de hero-achtergrond. Omhult elk host-scherm.
 *
 * `TvStageBackground` staat als sibling vóór `children` (niet eromheen). DOM-volgorde
 * alleen is hier NIET genoeg: `TvStageBackground` is intern `absolute` (nodig om de
 * illustratie/scrim full-bleed te leggen), en CSS schildert gepositioneerde elementen
 * altijd bóven niet-gepositioneerde in-flow content — ongeacht DOM-volgorde (CSS2.1
 * Appendix E, stap 3 vs. stap 6). Zonder dit zou elk TV-scherm zonder eigen
 * backdrop-filter/transform (elk stuk platte tekst) onzichtbaar onder de illustratie
 * verdwijnen; alleen elementen die toevallig zélf een stacking context vormen (bv. een
 * `GlassPanel`/`Dice` met `backdrop-filter`) zouden nog zichtbaar blijven. `relative`
 * hier plaatst het schermcontent-blok in dezelfde "gepositioneerd"-laag als de
 * achtergrond, waarna DOM-volgorde daarbinnen wél bepaalt wat bovenop komt (`children`
 * na `TvStageBackground` ⇒ content boven de illustratie) — geen z-index nodig, wél
 * positionering.
 */
export function TvShell({ children, scrimLevel = 'lobby' }: TvShellProps) {
  return (
    <div className="relative h-full bg-hero-pattern">
      <TvStageBackground level={scrimLevel} />
      <div className="relative h-full">{children}</div>
    </div>
  )
}
