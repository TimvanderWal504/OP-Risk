import { describe, expect, it } from 'vitest'
import { GamePhaseDto } from '../../../types/GameState'
import { TvPlaceholderScreen } from './TvPlaceholderScreen'
import { fixtureState } from './tvScreenFixture'
import { resolveTvOverlay, resolveTvScreen, tvScreens } from './tvScreens'

describe('tvScreens', () => {
  it('heeft voor elke spelfase een scherm', () => {
    for (const phase of Object.values(GamePhaseDto)) {
      expect(tvScreens[phase]).toBeTypeOf('function')
    }
  })

  it('valt terug op de placeholder bij een onbekende of ontbrekende fase', () => {
    expect(resolveTvScreen(undefined)).toBe(TvPlaceholderScreen)
    expect(resolveTvScreen(99 as GamePhaseDto)).toBe(TvPlaceholderScreen)
  })

  // De overlay-as (motion.ts C9-C12) ligt qua vorm vast, maar de overlays zelf zijn
  // bouwstap 5/6-werk — tot die tijd hoort hier niets overheen te komen.
  it('levert nog geen overlay zolang die schermen niet bestaan', () => {
    expect(resolveTvOverlay(fixtureState)).toBeNull()
  })
})
