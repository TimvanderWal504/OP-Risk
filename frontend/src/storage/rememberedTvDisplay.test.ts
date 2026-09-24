import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readRememberedTvDisplay, rememberTvDisplay, TV_DISPLAY_STORAGE_KEY } from './rememberedTvDisplay'
import { TvLanguageDto } from '../types/TvDisplay'
import { memoryStorage } from '../test/memoryStorage'

const settings = { textScale: 65, glassOpacity: 40, glassBlur: 90, language: TvLanguageDto.En, diceScale: 35 }

describe('rememberedTvDisplay', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('geeft null zolang er niets onthouden is', () => {
    expect(readRememberedTvDisplay()).toBeNull()
  })

  it('leest terug wat na een serverbevestiging onthouden is', () => {
    rememberTvDisplay(settings)

    expect(readRememberedTvDisplay()).toEqual(settings)
  })

  it.each([
    ['geen JSON', 'niet-json'],
    ['waarde buiten bereik', JSON.stringify({ ...settings, textScale: 105 })],
    ['waarde niet op een stap', JSON.stringify({ ...settings, glassBlur: 7 })],
    ['ontbrekend veld', JSON.stringify({ textScale: 50, glassOpacity: 50, glassBlur: 50, language: 0 })],
    ['onbekende taal', JSON.stringify({ ...settings, language: 9 })],
  ])('gooit een ongeldige cache weg in plaats van hem mee te sturen (%s)', (_, raw) => {
    localStorage.setItem(TV_DISPLAY_STORAGE_KEY, raw)

    expect(readRememberedTvDisplay()).toBeNull()
    expect(localStorage.getItem(TV_DISPLAY_STORAGE_KEY)).toBeNull()
  })

  it('faalt stil als er geen opslag beschikbaar is', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('geblokkeerd')
      },
      setItem: () => {
        throw new Error('geblokkeerd')
      },
    })

    expect(() => rememberTvDisplay(settings)).not.toThrow()
    expect(readRememberedTvDisplay()).toBeNull()
  })
})
