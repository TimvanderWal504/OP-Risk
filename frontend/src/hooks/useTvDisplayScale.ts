import { useContext } from 'react'
import { DESIGN_SCALE, TvDisplayScaleContext, type TvDisplayScale } from './TvDisplayScaleContext'
import type { GlassPanelContext } from '../styles/glass-tokens'

/**
 * De TV-weergave-factoren voor een element met device-as `context` (plan-testronde-tv punt 2).
 * Alleen `'tv'` binnen een `TvShell` met instelling krijgt echte factoren; op de telefoon en
 * daarbuiten is alles 1 — het design ongewijzigd.
 */
export function useTvDisplayScale(context: GlassPanelContext = 'tv'): TvDisplayScale {
  const scale = useContext(TvDisplayScaleContext)

  return context === 'tv' && scale ? scale : DESIGN_SCALE
}
