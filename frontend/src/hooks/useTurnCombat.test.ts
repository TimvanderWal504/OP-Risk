import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CombatBroadcastState } from './useCombatBroadcast'
import { useTurnCombat } from './useTurnCombat'

const combat = (correlationId: string): CombatBroadcastState => ({
  correlationId,
  attackerRolls: [5],
  defenderRolls: [6],
  reroll: null,
  defenseBoostUsed: false,
  narrated: null,
})

describe('useTurnCombat', () => {
  it('geeft het gevecht van de lopende beurt door', () => {
    const { result } = renderHook(() => useTurnCombat(combat('c1'), 'alice'))

    expect(result.current?.correlationId).toBe('c1')
  })

  it('laat een gevecht van een vorige beurt vallen zodra de beurt doorschuift, ook als die speler weer aan de beurt komt', () => {
    const old = combat('c1')
    const { result, rerender } = renderHook(({ active }) => useTurnCombat(old, active), {
      initialProps: { active: 'alice' as string | null },
    })

    rerender({ active: 'bob' })
    expect(result.current).toBeNull()

    rerender({ active: 'alice' })
    expect(result.current).toBeNull()
  })

  it('laat een nieuw gevecht na de beurtwissel gewoon door', () => {
    const { result, rerender } = renderHook(({ current, active }) => useTurnCombat(current, active), {
      initialProps: { current: combat('c1'), active: 'alice' as string | null },
    })

    rerender({ current: combat('c1'), active: 'bob' })
    rerender({ current: combat('c2'), active: 'bob' })

    expect(result.current?.correlationId).toBe('c2')
  })
})
