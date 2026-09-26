import { useMemo, type ReactNode } from 'react'
import { TvStageBackground } from './TvStageBackground'
import { TvDisplayScaleContext, type TvDisplayScale } from '../../hooks/TvDisplayScaleContext'
import type { StageScrimLevel } from '../../styles/glass-tokens'
import { sliderToMultiplier, textScaleVars } from '../../styles/tvDisplay'
import type { TvDisplaySettingsDto } from '../../types/TvDisplay'

export interface TvShellProps {
  children: ReactNode
  /** Scrim-intensiteit van de persistente stage-achtergrond, zie `tvScreens.resolveStageScrimLevel`. */
  scrimLevel?: StageScrimLevel
  /**
   * TV-weergave van het spel (plan-testronde-tv punt 2). Weglaten (nog geen state, of een
   * foutmelding) betekent: het design ongewijzigd.
   */
  display?: TvDisplaySettingsDto
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
 *
 * Met `display` zet de shell daarnaast de TV-weergave: tekstschaal via `--text-*` (zie
 * `textScaleVars`), en alle factoren (ook voor kaartmarkers, glas en dobbelstenen) via
 * `TvDisplayScaleContext`, te lezen met `useTvDisplayScale`.
 */
export function TvShell({ children, scrimLevel = 'lobby', display }: TvShellProps) {
  const text = display ? sliderToMultiplier(display.textScale) : null
  const glassOpacity = display ? sliderToMultiplier(display.glassOpacity) : null
  const glassBlur = display ? sliderToMultiplier(display.glassBlur) : null
  const dice = display ? sliderToMultiplier(display.diceScale) : null

  const style = useMemo(() => (text === null ? undefined : textScaleVars(text)), [text])
  const scale = useMemo<TvDisplayScale | null>(
    () =>
      text === null || glassOpacity === null || glassBlur === null || dice === null
        ? null
        : { text, glassOpacity, glassBlur, dice },
    [text, glassOpacity, glassBlur, dice],
  )

  return (
    <TvDisplayScaleContext.Provider value={scale}>
      <div className="relative h-full bg-hero-pattern" style={style}>
        <TvStageBackground level={scrimLevel} />
        <div className="relative h-full">{children}</div>
      </div>
    </TvDisplayScaleContext.Provider>
  )
}
