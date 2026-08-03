import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('telt af vanaf remainingMs naarmate de tijd verstrijkt', () => {
    const { result } = renderHook(() => useCountdown({ remainingMs: 5000, isPaused: false }))

    expect(result.current).toBe(5000)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current).toBeLessThanOrEqual(3000)
    expect(result.current).toBeGreaterThan(2900)
  })

  it('telt niet af zolang isPaused true is', () => {
    const { result } = renderHook(() => useCountdown({ remainingMs: 5000, isPaused: true }))

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current).toBe(5000)
  })

  it('her-ankert op een nieuwe remainingMs-waarde uit een volgende server-push', () => {
    const { result, rerender } = renderHook(({ timer }) => useCountdown(timer), {
      initialProps: { timer: { remainingMs: 5000, isPaused: false } },
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current).toBeLessThan(5000)

    rerender({ timer: { remainingMs: 9000, isPaused: false } })

    expect(result.current).toBe(9000)
  })

  it('toont nooit een negatieve waarde, ook niet ruim na het verlopen van de timer', () => {
    const { result } = renderHook(() => useCountdown({ remainingMs: 1000, isPaused: false }))

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current).toBe(0)
  })

  it('valt terug op 0 als er geen timer is', () => {
    const { result } = renderHook(() => useCountdown(null))

    expect(result.current).toBe(0)
  })
})
