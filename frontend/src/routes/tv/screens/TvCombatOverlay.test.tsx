import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto, TurnPhaseDto } from '../../../types/GameState'
import { fixtureState } from './tvScreenFixture'
import { TvCombatOverlay } from './TvCombatOverlay'
import type { CombatBroadcastState } from '../../../hooks/useCombatBroadcast'

const baseState = {
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  territories: [
    { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 3 },
    { territoryId: 'ukraine', ownerPlayerId: 'bob', armyCount: 2 },
  ],
  turnState: {
    activePlayerId: 'alice',
    turnPhase: TurnPhaseDto.Attack,
    armiesRemaining: 0,
    pendingCombat: { fromTerritoryId: 'alaska', toTerritoryId: 'ukraine', attackDice: 2 },
    timer: { remainingMs: 60_000, isPaused: true },
    reinforcementBreakdown: null,
  },
}

describe('TvCombatOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toont de gevecht-kicker en de dobbelstenen van beide spelers zodra ze binnenkomen', () => {
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [5, 4],
      defenderRolls: [3],
      narrated: null,
    }

    render(<TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    expect(screen.getByText('Gevecht')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('toont het resultaat en de VEROVERD-badge zodra CombatNarrated een verovering meldt', () => {
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [5, 4],
      defenderRolls: [1],
      narrated: {
        correlationId: 'c1',
        attackerId: 'alice',
        defenderId: 'bob',
        fromTerritoryId: 'alaska',
        toTerritoryId: 'ukraine',
        attackerLosses: 0,
        defenderLosses: 2,
        conquered: true,
        eliminatedPlayerId: null,
        stateVersion: 4,
      },
    }

    render(<TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    expect(screen.getByText('Rood verslaat 2 legers')).toBeInTheDocument()
    expect(screen.getByText('VEROVERD')).toBeInTheDocument()
  })

  // Altijd vanuit de aanvaller (Rood/alice), ook bij de gemengde 1-om-1-uitkomst — zie de
  // toelichting bij `attackTv.resultLine`. Zelfde drie vormen als `AttackFlowStep.test.tsx`.
  it.each([
    [1, 0, 'Rood verliest 1 leger'],
    [2, 0, 'Rood verliest 2 legers'],
    [1, 1, 'Rood en Blauw verliezen beide 1 leger'],
  ])('schrijft uitkomst %i-om-%i verhalend uit, vanuit de aanvaller', (attackerLosses, defenderLosses, expected) => {
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [5, 4],
      defenderRolls: [6, 6],
      narrated: {
        correlationId: 'c1',
        attackerId: 'alice',
        defenderId: 'bob',
        fromTerritoryId: 'alaska',
        toTerritoryId: 'ukraine',
        attackerLosses,
        defenderLosses,
        conquered: false,
        eliminatedPlayerId: null,
        stateVersion: 4,
      },
    }

    render(<TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('wisselt na 2000ms naar de eliminatie-weergave zodra er een eliminatedPlayerId gemeld is', () => {
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [6, 6],
      defenderRolls: [1],
      narrated: {
        correlationId: 'c1',
        attackerId: 'alice',
        defenderId: 'bob',
        fromTerritoryId: 'alaska',
        toTerritoryId: 'ukraine',
        attackerLosses: 0,
        defenderLosses: 1,
        conquered: true,
        eliminatedPlayerId: 'bob',
        stateVersion: 5,
      },
    }

    render(<TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    expect(screen.queryByText('Bob UITGESCHAKELD')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText('Bob UITGESCHAKELD')).toBeInTheDocument()
    expect(screen.getByText('Verslagen door Alice')).toBeInTheDocument()
  })
})
