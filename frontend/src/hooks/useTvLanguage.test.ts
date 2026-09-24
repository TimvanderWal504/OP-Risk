import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTvLanguage } from './useTvLanguage'
import { TvLanguageDto } from '../types/TvDisplay'
import { i18next, LANGUAGE_STORAGE_KEY } from '../i18n'
import { memoryStorage } from '../test/memoryStorage'

describe('useTvLanguage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
  })

  afterEach(async () => {
    await i18next.changeLanguage('nl')
    vi.unstubAllGlobals()
  })

  it('zet de taal op wat de server voor de TV doorgeeft', async () => {
    renderHook(() => useTvLanguage(TvLanguageDto.En))

    await waitFor(() => expect(i18next.resolvedLanguage).toBe('en'))
  })

  it('schrijft de TV-taal niet naar localStorage — die key is van de telefoonroute', async () => {
    renderHook(() => useTvLanguage(TvLanguageDto.En))

    await waitFor(() => expect(i18next.resolvedLanguage).toBe('en'))
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull()
  })

  it('volgt een latere wijziging van de host', async () => {
    const { rerender } = renderHook(({ language }) => useTvLanguage(language), {
      initialProps: { language: TvLanguageDto.En as TvLanguageDto },
    })
    await waitFor(() => expect(i18next.resolvedLanguage).toBe('en'))

    rerender({ language: TvLanguageDto.Nl })

    await waitFor(() => expect(i18next.resolvedLanguage).toBe('nl'))
  })

  it('negeert een onbekende taalwaarde i.p.v. de browserdetectie opnieuw te starten', () => {
    renderHook(() => useTvLanguage(9 as TvLanguageDto))

    expect(i18next.resolvedLanguage).toBe('nl')
  })

  it('laat de taal staan zolang er nog geen state is', () => {
    renderHook(() => useTvLanguage(undefined))

    expect(i18next.resolvedLanguage).toBe('nl')
  })
})
