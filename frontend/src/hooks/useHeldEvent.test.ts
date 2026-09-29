import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto, RecentActionKindDto, type GameStateDto, type RecentActionDto } from '../types/GameState'
import { fixtureState } from '../routes/tv/screens/tvScreenFixture'
import { EVENT_CARD_HOLD_MS, useHeldEvent } from './useHeldEvent'

const drawn = (eventId: string, sequence: number): RecentActionDto => ({
  sequence,
  kind: RecentActionKindDto.EventDrawn,
  playerId: null,
  otherPlayerId: null,
  territoryId: null,
  fromTerritoryId: null,
  amount: null,
  total: null,
  attackerLosses: null,
  defenderLosses: null,
  eventId,
  eventBonus: null,
})

const withLog = (recentActions: RecentActionDto[], overrides: Partial<GameStateDto> = {}): GameStateDto => ({
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  recentActions,
  ...overrides,
})

describe('useHeldEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('houdt een trekking die de TV ziet gebeuren 8 seconden vast', () => {
    const { result, rerender } = renderHook(({ state }) => useHeldEvent(state, false), {
      initialProps: { state: withLog([]) },
    })

    rerender({ state: withLog([drawn('babyboom', 5)]) })
    expect(result.current).toEqual({ eventId: 'babyboom', sequence: 5 })

    act(() => vi.advanceTimersByTime(EVENT_CARD_HOLD_MS - 1))
    expect(result.current).not.toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBeNull()
  })

  it('toont een trekking die er bij het laden al stond niet opnieuw', () => {
    const { result } = renderHook(() => useHeldEvent(withLog([drawn('babyboom', 5)]), false))

    expect(result.current).toBeNull()
  })

  it('herkent dezelfde kaart twee keer aan een nieuw volgnummer', () => {
    const { result, rerender } = renderHook(({ state }) => useHeldEvent(state, false), {
      initialProps: { state: withLog([drawn('griepgolf', 3)]) },
    })

    rerender({ state: withLog([drawn('griepgolf', 9), drawn('griepgolf', 3)]) })

    expect(result.current).toEqual({ eventId: 'griepgolf', sequence: 9 })
  })

  it('laat de kaart los zodra er een gevecht loopt, en brengt hem niet terug', () => {
    const { result, rerender } = renderHook(({ state, combat }) => useHeldEvent(state, combat), {
      initialProps: { state: withLog([]), combat: false },
    })

    rerender({ state: withLog([drawn('babyboom', 5)]), combat: false })
    rerender({ state: withLog([drawn('babyboom', 5)]), combat: true })
    expect(result.current).toBeNull()

    rerender({ state: withLog([drawn('babyboom', 5)]), combat: false })
    expect(result.current).toBeNull()
  })

  it('laat een legerverlies-kaart los zodra de laatste keuze binnen is', () => {
    const pending = { eventId: 'griepgolf', amount: 2, chooserPlayerIds: ['alice'], awaitingPlayerIds: ['alice'] }
    const { result, rerender } = renderHook(({ state }) => useHeldEvent(state, false), {
      initialProps: { state: withLog([]) },
    })

    rerender({ state: withLog([drawn('griepgolf', 5)], { pendingAttrition: pending }) })
    expect(result.current).not.toBeNull()

    rerender({ state: withLog([drawn('griepgolf', 5)], { pendingAttrition: null }) })
    expect(result.current).toBeNull()
  })
})
