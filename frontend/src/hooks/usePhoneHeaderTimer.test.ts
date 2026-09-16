import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePhoneHeaderTimer } from './usePhoneHeaderTimer'

describe('usePhoneHeaderTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('geeft timer null wanneer er geen beurttimer is (Claiming/InitialPlacement)', () => {
    const { result } = renderHook(() => usePhoneHeaderTimer(null))

    expect(result.current.timer).toBeNull()
    expect(result.current.timerState).toBe('normal')
  })

  it('formatteert mm:ss en geeft normal onder de lage-tijd-drempel niet', () => {
    const { result } = renderHook(() => usePhoneHeaderTimer({ remainingMs: 125_000, isPaused: false }))

    expect(result.current.timer).toBe('2:05')
    expect(result.current.timerState).toBe('normal')
  })

  it('geeft low onder de 60-seconden-drempel', () => {
    const { result } = renderHook(() => usePhoneHeaderTimer({ remainingMs: 45_000, isPaused: false }))

    expect(result.current.timer).toBe('0:45')
    expect(result.current.timerState).toBe('low')
  })

  it('geeft paused wanneer de timer gepauzeerd is, ongeacht de resterende tijd', () => {
    const { result } = renderHook(() => usePhoneHeaderTimer({ remainingMs: 200_000, isPaused: true }))

    expect(result.current.timer).toBe('3:20')
    expect(result.current.timerState).toBe('paused')
  })
})
