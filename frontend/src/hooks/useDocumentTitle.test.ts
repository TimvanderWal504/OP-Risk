import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle'
import { i18next } from '../i18n'

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'Operatie Atlas'
  })

  afterEach(async () => {
    await i18next.changeLanguage('nl')
  })

  it('zet de titel van de TV-route', () => {
    renderHook(() => useDocumentTitle('tv'))

    expect(document.title).toBe('Operatie Atlas — TV')
  })

  it('zet de titel van de spelersroute', () => {
    renderHook(() => useDocumentTitle('player'))

    expect(document.title).toBe('Operatie Atlas — Speler')
  })

  it('volgt een taalwissel', async () => {
    renderHook(() => useDocumentTitle('player'))

    await act(() => i18next.changeLanguage('en'))

    expect(document.title).toBe('Operation Atlas — Player')
  })

  it('zet de vorige titel terug bij unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('tv'))

    unmount()

    expect(document.title).toBe('Operatie Atlas')
  })
})
