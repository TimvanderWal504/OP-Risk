import { createContext } from 'react'

/**
 * De factoren van de TV-weergave (plan-testronde-tv punt 2), al omgerekend via
 * `sliderToMultiplier` — 1 is overal het design.
 */
export interface TvDisplayScale {
  /** Tekst die niet via de `--text-*`-typeschaal loopt: de SVG-kaartmarkers. */
  text: number
  /** Vermenigvuldigt de alpha van een glas-tint (begrensd op 1). */
  glassOpacity: number
  /** Vermenigvuldigt de blur-radius van glas. */
  glassBlur: number
  /** Schaalt een TV-dobbelsteen als geheel: maat, pips, rand, blur, schaduw. */
  dice: number
}

export const DESIGN_SCALE: TvDisplayScale = { text: 1, glassOpacity: 1, glassBlur: 1, dice: 1 }

/**
 * Door `TvShell` gezet, gelezen via `useTvDisplayScale`. `null` buiten een `TvShell` met
 * weergave-instellingen (telefoon, tests, de "verbinden…"-staat): dan geldt het design
 * ongewijzigd. Een context i.p.v. CSS-variabelen, zodat consumenten kant-en-klare waarden in JS
 * berekenen (zie `scaleGlassSurfaceAlpha`).
 */
export const TvDisplayScaleContext = createContext<TvDisplayScale | null>(null)
