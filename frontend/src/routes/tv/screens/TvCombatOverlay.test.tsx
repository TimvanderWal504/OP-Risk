import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto, TurnPhaseDto } from '../../../types/GameState'
import { fixtureState } from './tvScreenFixture'
import { TvCombatOverlay } from './TvCombatOverlay'
import { TvShell } from '../../../components/ui/TvShell'
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
    pendingCombat: { fromTerritoryId: 'alaska', toTerritoryId: 'ukraine', attackDice: 2, attackerRolls: [5, 3], awaitingRerollDecision: false },
    timer: { remainingMs: 60_000, isPaused: true },
    reinforcementBreakdown: null,
    fortifiesRemaining: 1,
    mustTradeInCards: false,
    reachableFortifyGroups: [],
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
      reroll: null,
      defenseBoostUsed: false,
      narrated: null,
    }

    render(<TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    expect(screen.getByText('Gevecht')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('reserveert in het gevechtsraster de geschaalde dobbelsteenmaat (plan-testronde-tv punt 2)', () => {
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [5, 4],
      defenderRolls: [3],
      reroll: null,
      defenseBoostUsed: false,
      narrated: null,
    }

    render(
      <TvShell display={{ ...baseState.tvDisplay, diceScale: 100 }}>
        <TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />
      </TvShell>,
    )

    // Dobbelsteen 96 → 192; kolom = drie dobbelstenen + twee ongeschaalde tussenruimtes van 16.
    const grid = screen.getByText('VS').parentElement!
    expect(grid.style.gridTemplateRows).toBe('auto auto 192px')
    expect(grid.style.gridTemplateColumns).toBe('608px auto 608px')
    expect(screen.getByRole('img', { name: 'Dobbelsteen 5' }).style.width).toBe('192px')
  })

  it('noemt de verdedigingsrol in het verdedigerlabel zodra de DefenseBoost is ingezet (FO §8.1)', () => {
    const state = {
      ...baseState,
      players: baseState.players.map((player) => (player.id === 'bob' ? { ...player, roleId: 'pendekar' } : player)),
    }
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [4],
      defenderRolls: [6, 5],
      reroll: null,
      defenseBoostUsed: true,
      narrated: null,
    }

    render(<TvCombatOverlay state={state} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    const label = screen.getByText('Verdediger · Pendekar')
    expect(label).toHaveClass('text-silver-400')
    expect(screen.queryByText('Verdediger')).not.toBeInTheDocument()
  })

  it('toont het gewone verdedigerlabel zonder ingezette DefenseBoost', () => {
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [4],
      defenderRolls: [6],
      reroll: null,
      defenseBoostUsed: false,
      narrated: null,
    }

    render(<TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    expect(screen.getByText('Verdediger')).toHaveClass('text-fg-muted')
  })

  it('geeft alleen de herworpen dobbelsteen de reroll-animatie, de rest blijft de gewone tumble (plan-rollen B2)', () => {
    // newValue (6) staat na de herwerp vooraan (attackerRolls is de nieuwe, gesorteerde worp) —
    // rerollHighlightIndex wordt op waarde gezocht, niet op de oude array-positie (die schuift
    // door de hersortering van RerollDie).
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [6, 4],
      defenderRolls: null,
      reroll: { previousRolls: [4, 2], rerolledDieIndex: 1, newValue: 6, rolls: [6, 4] },
      defenseBoostUsed: false,
      narrated: null,
    }

    render(<TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    // Geen verdedigingsworp in deze combat-fixture, dus alleen de twee aanvallersdobbelstenen.
    const dice = screen.getAllByRole('img')
    expect(dice).toHaveLength(2)
    expect(dice[0].parentElement?.style.animation).toContain('atlasReroll')
    expect(dice[1].parentElement?.style.animation).toContain('atlasRollL')
  })

  it('valt terug op de gewone tumble-animatie zolang er geen reroll heeft plaatsgevonden', () => {
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [5, 4],
      defenderRolls: null,
      reroll: null,
      defenseBoostUsed: false,
      narrated: null,
    }

    render(<TvCombatOverlay state={baseState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={combat} />)

    const dice = screen.getAllByRole('img')
    for (const die of dice) {
      expect(die.parentElement?.style.animation).not.toContain('atlasReroll')
    }
  })

  it('toont het resultaat en de VEROVERD-badge zodra CombatNarrated een verovering meldt', () => {
    const combat: CombatBroadcastState = {
      correlationId: 'c1',
      attackerRolls: [5, 4],
      defenderRolls: [1],
      reroll: null,
      defenseBoostUsed: false,
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
      reroll: null,
      defenseBoostUsed: false,
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
      reroll: null,
      defenseBoostUsed: false,
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
