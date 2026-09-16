import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMissionPanel } from './useMissionPanel'

describe('useMissionPanel', () => {
  it('start dicht en zonder wijzigingsmelding', () => {
    const { result } = renderHook(() => useMissionPanel('territory-24'))

    expect(result.current.open).toBe(false)
    expect(result.current.changed).toBe(false)
  })

  it('opent en sluit via openPanel/closePanel', () => {
    const { result } = renderHook(() => useMissionPanel('territory-24'))

    act(() => result.current.openPanel())
    expect(result.current.open).toBe(true)

    act(() => result.current.closePanel())
    expect(result.current.open).toBe(false)
  })

  it('zet changed wanneer missionId later verandert, niet bij de eerste render', () => {
    const { result, rerender } = renderHook(({ missionId }) => useMissionPanel(missionId), {
      initialProps: { missionId: 'territory-24' },
    })

    expect(result.current.changed).toBe(false)

    rerender({ missionId: 'territory-18-min2' })

    expect(result.current.changed).toBe(true)
  })

  it('wist changed via dismissChanged', () => {
    const { result, rerender } = renderHook(({ missionId }) => useMissionPanel(missionId), {
      initialProps: { missionId: 'territory-24' },
    })

    rerender({ missionId: 'territory-18-min2' })
    expect(result.current.changed).toBe(true)

    act(() => result.current.dismissChanged())
    expect(result.current.changed).toBe(false)
  })
})
