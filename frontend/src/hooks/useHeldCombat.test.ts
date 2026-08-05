import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto, TurnPhaseDto, type GameStateDto } from '../types/GameState'
import type { CombatNarratedMessage } from '../types/HubResponses'
import { fixtureState } from '../routes/tv/screens/tvScreenFixture'
import { useHeldCombat } from './useHeldCombat'
import type { CombatBroadcastState } from './useCombatBroadcast'

const narrated = (overrides: Partial<CombatNarratedMessage> = {}): CombatNarratedMessage => ({
  correlationId: 'combat-1',
  attackerId: 'alice',
  defenderId: 'bob',
  fromTerritoryId: 'a',
  toTerritoryId: 'b',
  attackerLosses: 1,
  defenderLosses: 0,
  conquered: false,
  eliminatedPlayerId: null,
  stateVersion: 2,
  ...overrides,
})

const combat = (overrides: Partial<CombatBroadcastState> = {}): CombatBroadcastState => ({
  correlationId: 'combat-1',
  attackerRolls: [5],
  defenderRolls: [3],
  narrated: null,
  ...overrides,
})

const inProgressState = (overrides: Partial<NonNullable<GameStateDto['turnState']>> = {}): GameStateDto => ({
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  turnState: {
    activePlayerId: 'alice',
    turnPhase: TurnPhaseDto.Attack,
    armiesRemaining: 0,
    pendingCombat: null,
    timer: { remainingMs: 60_000, isPaused: true },
    reinforcementBreakdown: null,
    ...overrides,
  },
})

describe('useHeldCombat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('blijft live zolang pendingCombat bestaat, ook als het gevecht al opgelost is (wacht op meeverplaatsen)', () => {
    const pendingCombat = { fromTerritoryId: 'a', toTerritoryId: 'b', attackDice: 3 }
    const state = inProgressState({ pendingCombat })
    const resolved = combat({ narrated: narrated({ conquered: true }) })

    const { result } = renderHook(() => useHeldCombat(resolved, state))

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current).toEqual(resolved)
  })

  it('start de houd-telling pas zodra het gevecht opgelost én pendingCombat leeg is, en verwijdert na 5000ms', () => {
    const state = inProgressState({ pendingCombat: null })
    const resolved = combat({ narrated: narrated() })

    const { result } = renderHook(() => useHeldCombat(resolved, state))

    expect(result.current).toEqual(resolved)

    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(result.current).toEqual(resolved)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBeNull()
  })

  it('leegt niet op basis van pendingCombat===null alleen, zolang het gevecht nog niet is opgelost (narrated===null) — voorkomt de declare-broadcast-race', () => {
    const state = inProgressState({ pendingCombat: null })
    const inFlight = combat({ narrated: null })

    const { result } = renderHook(() => useHeldCombat(inFlight, state))

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(result.current).toEqual(inFlight)
  })

  it('leegt synchroon zodra turnPhase Attack verlaat binnen InProgress (bv. EndPhase naar Fortify)', () => {
    const resolved = combat({ narrated: narrated() })
    const attackState = inProgressState({ pendingCombat: null })

    const { result, rerender } = renderHook(({ c, s }) => useHeldCombat(c, s), {
      initialProps: { c: resolved, s: attackState },
    })

    expect(result.current).toEqual(resolved)

    const fortifyState = inProgressState({ turnPhase: TurnPhaseDto.Fortify, pendingCombat: null })
    rerender({ c: resolved, s: fortifyState })

    expect(result.current).toBeNull()
  })

  it('leegt niet synchroon bij de overgang naar Finished — de houd-telling loopt gewoon af', () => {
    const resolved = combat({ narrated: narrated({ eliminatedPlayerId: 'bob' }) })
    const attackState = inProgressState({ pendingCombat: null })

    const { result, rerender } = renderHook(({ c, s }) => useHeldCombat(c, s), {
      initialProps: { c: resolved, s: attackState },
    })

    const finishedState: GameStateDto = { ...fixtureState, phase: GamePhaseDto.Finished, turnState: null }
    rerender({ c: resolved, s: finishedState })

    expect(result.current).toEqual(resolved)

    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(result.current).toEqual(resolved)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBeNull()
  })

  it('leegt synchroon zodra activePlayerId wisselt terwijl turnPhase Attack blijft (auto-skip Fortify+Reinforce zonder tussenliggende broadcast)', () => {
    const resolved = combat({ narrated: narrated({ conquered: true }) })
    const aliceAttackState = inProgressState({ activePlayerId: 'alice', turnPhase: TurnPhaseDto.Attack, pendingCombat: null })

    const { result, rerender } = renderHook(({ c, s }) => useHeldCombat(c, s), {
      initialProps: { c: resolved, s: aliceAttackState },
    })

    expect(result.current).toEqual(resolved)

    // Server slaat Verplaatsen(alice) én Versterken(bob) allebei over zonder geldige zetten en
    // broadcast pas de resulterende state — client ziet turnPhase nooit anders dan Attack.
    const bobAttackState = inProgressState({ activePlayerId: 'bob', turnPhase: TurnPhaseDto.Attack, pendingCombat: null })
    rerender({ c: resolved, s: bobAttackState })

    expect(result.current).toBeNull()
  })

  it('een nieuw gevecht (andere correlationId) overschrijft een lopende houd-periode direct', () => {
    const state = inProgressState({ pendingCombat: null })
    const first = combat({ narrated: narrated() })

    const { result, rerender } = renderHook(({ c, s }) => useHeldCombat(c, s), {
      initialProps: { c: first, s: state },
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const secondState = inProgressState({
      pendingCombat: { fromTerritoryId: 'a', toTerritoryId: 'c', attackDice: 2 },
    })
    const second = combat({ correlationId: 'combat-2', narrated: null })
    rerender({ c: second, s: secondState })

    expect(result.current).toEqual(second)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current).toEqual(second)
  })
})
