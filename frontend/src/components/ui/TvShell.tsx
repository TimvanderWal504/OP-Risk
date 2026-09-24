import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { TvStageBackground } from './TvStageBackground'
import { TvDisplayScaleContext, type TvDisplayScale } from '../../hooks/TvDisplayScaleContext'
import type { StageScrimLevel } from '../../styles/glass-tokens'
import { fontSize } from '../../styles/design-tokens'
import { sliderToMultiplier } from '../../styles/tvDisplay'
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

/** `rem`-basis van de typeschaal: `--text-*` in `twc-theme.css` = `fontSize`-px / 16. */
const REM_PX = 16

/**
 * Overschrijft elke `--text-<stap>` uit de typeschaal (`fontSize` in `design-tokens.ts`, dezelfde
 * namen als in `twc-theme.css`) binnen de TV-shell, geschaald met de tekstschaal-factor. Alleen
 * hier, niet op `:root`: een `:root`-variabele die naar een andere variabele verwijst, wordt al op
 * `:root` opgelost en zou een factor op de shell nooit zien. Letterlijke `rem`-waarden, geen
 * `calc()` — zie `scaleGlassSurfaceAlpha` voor dezelfde overweging. De telefoon rendert nooit een
 * `TvShell`, dus blijft ongemoeid.
 */
function textScaleVars(factor: number): CSSProperties {
  return Object.fromEntries(
    Object.entries(fontSize).map(([step, px]) => [`--text-${step}`, `${(px / REM_PX) * factor}rem`]),
  ) as CSSProperties
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
