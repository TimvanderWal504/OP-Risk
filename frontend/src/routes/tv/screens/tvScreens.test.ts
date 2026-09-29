import { describe, expect, it } from 'vitest'
import { GamePhaseDto } from '../../../types/GameState'
import { TvPlaceholderScreen } from './TvPlaceholderScreen'
import { TvGameOverScreen } from './TvGameOverScreen'
import { TvCombatOverlay } from './TvCombatOverlay'
import { resolveTvOverlay, resolveTvScreen, tvScreens } from './tvScreens'
import { TvEventOverlay } from './TvEventOverlay'

describe('tvScreens', () => {
  it('heeft voor elke spelfase een scherm', () => {
    for (const phase of Object.values(GamePhaseDto)) {
      expect(tvScreens[phase]).toBeTypeOf('function')
    }
  })

  it('koppelt Finished aan TvGameOverScreen, niet de placeholder', () => {
    expect(tvScreens[GamePhaseDto.Finished]).toBe(TvGameOverScreen)
  })

  it('valt terug op de placeholder bij een onbekende of ontbrekende fase', () => {
    expect(resolveTvScreen(undefined)).toBe(TvPlaceholderScreen)
    expect(resolveTvScreen(99 as GamePhaseDto)).toBe(TvPlaceholderScreen)
  })

  // De overlay-as (motion.ts C9-C12): combat (C9/C11) en de gebeurteniskaart (C10). Een gevecht wint.
  it('levert de combat-overlay zodra er gehouden combat-data is', () => {
    expect(
      resolveTvOverlay({ correlationId: 'c1', attackerRolls: [5], defenderRolls: null, reroll: null, defenseBoostUsed: false, narrated: null }),
    ).toBe(TvCombatOverlay)
  })

  it('levert geen overlay zolang er geen combat-data, kaart of keuzes zijn', () => {
    expect(resolveTvOverlay(null)).toBeNull()
  })

  it('levert de gebeurteniskaart voor een vastgehouden trekking of lopende keuzes', () => {
    expect(resolveTvOverlay(null, { eventId: 'babyboom', sequence: 4 })).toBe(TvEventOverlay)
    expect(
      resolveTvOverlay(null, null, { eventId: 'griepgolf', amount: 2, chooserPlayerIds: ['alice'], awaitingPlayerIds: ['alice'] }),
    ).toBe(TvEventOverlay)
  })

  it('laat een gevecht winnen van de gebeurteniskaart', () => {
    expect(
      resolveTvOverlay(
        { correlationId: 'c1', attackerRolls: [5], defenderRolls: null, reroll: null, defenseBoostUsed: false, narrated: null },
        { eventId: 'babyboom', sequence: 4 },
      ),
    ).toBe(TvCombatOverlay)
  })
})
