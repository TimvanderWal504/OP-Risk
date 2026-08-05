import { describe, expect, it } from 'vitest'
import { GamePhaseDto } from '../../../types/GameState'
import { TvPlaceholderScreen } from './TvPlaceholderScreen'
import { TvCombatOverlay } from './TvCombatOverlay'
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

  // De overlay-as (motion.ts C9-C12) ligt qua vorm vast; combat (C9/C11) is de eerste die
  // 'm invult. Gebeurtenis/attritie (C10) bestaan nog niet — geen `combat`-input voor die,
  // dus altijd `null` zolang er geen gevecht loopt.
  it('levert de combat-overlay zodra er gehouden combat-data is', () => {
    expect(
      resolveTvOverlay({ correlationId: 'c1', attackerRolls: [5], defenderRolls: null, narrated: null }),
    ).toBe(TvCombatOverlay)
  })

  it('levert geen overlay zolang er geen combat-data is', () => {
    expect(resolveTvOverlay(null)).toBeNull()
  })
})
