import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto } from '../types/GameState'
import { useHeldPhase } from './useHeldPhase'

describe('useHeldPhase', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('houdt de volgorde-uitslag vast nadat de server al verder is', () => {
    const { result, rerender } = renderHook(({ phase }) => useHeldPhase(phase), {
      initialProps: { phase: GamePhaseDto.OrderRoll as GamePhaseDto },
    })

    rerender({ phase: GamePhaseDto.Claiming })
    expect(result.current).toBe(GamePhaseDto.OrderRoll)

    act(() => vi.advanceTimersByTime(5000))
    expect(result.current).toBe(GamePhaseDto.Claiming)
  })

  it('laat de volgorde-uitslag meteen los bij "Verder op TV"', () => {
    const { result, rerender } = renderHook(({ phase, skip }) => useHeldPhase(phase, skip), {
      initialProps: { phase: GamePhaseDto.OrderRoll as GamePhaseDto, skip: 0 },
    })

    rerender({ phase: GamePhaseDto.Claiming, skip: 0 })
    rerender({ phase: GamePhaseDto.Claiming, skip: 1 })

    expect(result.current).toBe(GamePhaseDto.Claiming)
  })
})
