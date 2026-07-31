import { describe, expect, it } from 'vitest'
import { GamePhaseDto } from '../../../types/GameState'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'
import { phoneScreens, resolvePhoneScreen } from './phoneScreens'

describe('phoneScreens', () => {
  it('heeft voor elke spelfase een scherm', () => {
    for (const phase of Object.values(GamePhaseDto)) {
      expect(phoneScreens[phase]).toBeTypeOf('function')
    }
  })

  it('valt terug op de placeholder zolang er nog geen fase bekend is', () => {
    expect(resolvePhoneScreen(undefined)).toBe(PhonePlaceholderScreen)
  })

  // Versie-skew: een oudere bundel die een nieuwere serverfase binnenkrijgt, mag geen
  // undefined component opleveren (wit scherm midden in een pot).
  it('valt terug op de placeholder bij een fase die deze bundel niet kent', () => {
    expect(resolvePhoneScreen(99 as GamePhaseDto)).toBe(PhonePlaceholderScreen)
  })
})
