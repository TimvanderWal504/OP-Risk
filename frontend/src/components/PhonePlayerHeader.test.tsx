import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PhonePlayerHeader } from './PhonePlayerHeader'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'
import { GamePhaseDto, TurnPhaseDto } from '../types/GameState'

describe('PhonePlayerHeader', () => {
  it('toont identiteit en een korte fasenaam tijdens Claiming, geen beurttijd', () => {
    render(
      <PhonePlayerHeader
        state={fixtureState}
        me={fixtureState.players[0]}
        phase={GamePhaseDto.Claiming}
        tradeInCards={vi.fn()}
        error={null}
      />,
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Gebieden claimen')).toBeInTheDocument()
    expect(screen.queryByText('Beurttijd')).not.toBeInTheDocument()
  })

  it('toont de beurttijd tijdens InProgress, met de fasenaam van de huidige TurnPhaseDto', () => {
    const state = {
      ...fixtureState,
      phase: GamePhaseDto.InProgress,
      turnState: {
        activePlayerId: 'bob',
        turnPhase: TurnPhaseDto.Attack,
        armiesRemaining: 0,
        pendingCombat: null,
        timer: { remainingMs: 90_000, isPaused: false },
        reinforcementBreakdown: null,
        fortifiesRemaining: 1,
        mustTradeInCards: false,
        reachableFortifyGroups: [],
      },
    }

    render(
      <PhonePlayerHeader
        state={state}
        me={state.players[0]}
        phase={GamePhaseDto.InProgress}
        tradeInCards={vi.fn()}
        error={null}
      />,
    )

    expect(screen.getByText('Aanvallen')).toBeInTheDocument()
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('opent het missiepaneel via de actieknop wanneer de speler een missie heeft', async () => {
    const state = { ...fixtureState, players: [{ ...fixtureState.players[0], missionId: 'territory-24' }, fixtureState.players[1]] }

    render(
      <PhonePlayerHeader
        state={state}
        me={state.players[0]}
        phase={GamePhaseDto.Claiming}
        tradeInCards={vi.fn()}
        error={null}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mijn missie' }))

    expect(screen.getByText('Bezit 24 gebieden')).toBeInTheDocument()
  })

  it('houdt de missieknop inert zonder missie (bv. WinCondition.WorldDomination)', async () => {
    render(
      <PhonePlayerHeader
        state={fixtureState}
        me={fixtureState.players[0]}
        phase={GamePhaseDto.Claiming}
        tradeInCards={vi.fn()}
        error={null}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mijn missie' }))

    expect(screen.queryByText('Alleen zichtbaar voor jou.')).not.toBeInTheDocument()
  })

  it('rendert niets zolang de fase geen headerstatus heeft (Lobby/OrderRoll)', () => {
    const { container } = render(
      <PhonePlayerHeader
        state={fixtureState}
        me={fixtureState.players[0]}
        phase={GamePhaseDto.Lobby}
        tradeInCards={vi.fn()}
        error={null}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('rendert niets zolang de speler nog geen kleur heeft', () => {
    const state = { ...fixtureState, players: [{ ...fixtureState.players[0], colorId: null }, fixtureState.players[1]] }

    const { container } = render(
      <PhonePlayerHeader
        state={state}
        me={state.players[0]}
        phase={GamePhaseDto.Claiming}
        tradeInCards={vi.fn()}
        error={null}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('toont het handaantal als badge op "Mijn kaarten", amber zodra inleggen verplicht is', () => {
    const state = {
      ...fixtureState,
      phase: GamePhaseDto.InProgress,
      players: [
        { ...fixtureState.players[0], hand: [{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }] },
        fixtureState.players[1],
      ],
      turnState: {
        activePlayerId: 'alice',
        turnPhase: TurnPhaseDto.Reinforce,
        armiesRemaining: 3,
        pendingCombat: null,
        timer: { remainingMs: 90_000, isPaused: false },
        reinforcementBreakdown: null,
        fortifiesRemaining: 1,
        mustTradeInCards: true,
        reachableFortifyGroups: [],
      },
    }

    render(
      <PhonePlayerHeader
        state={state}
        me={state.players[0]}
        phase={GamePhaseDto.InProgress}
        tradeInCards={vi.fn()}
        error={null}
      />,
    )

    const badge = screen.getByText('1')
    expect(badge).toBeInTheDocument()
  })

  it('opent het "Mijn kaarten"-paneel via de actieknop', async () => {
    const state = { ...fixtureState, players: [{ ...fixtureState.players[0], hand: [] }, fixtureState.players[1]] }

    render(
      <PhonePlayerHeader
        state={state}
        me={state.players[0]}
        phase={GamePhaseDto.Claiming}
        tradeInCards={vi.fn()}
        error={null}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mijn kaarten' }))

    expect(screen.getByText('Nog geen kaarten. Verover in een beurt minstens één gebied en je trekt er een.')).toBeInTheDocument()
  })

  describe('taak 7 — eigen rol/boost-status op de statusregel (plan-rollen B4)', () => {
    const stateInProgress = {
      ...fixtureState,
      phase: GamePhaseDto.InProgress,
      turnState: {
        activePlayerId: 'bob',
        turnPhase: TurnPhaseDto.Attack,
        armiesRemaining: 0,
        pendingCombat: null,
        timer: { remainingMs: 90_000, isPaused: false },
        reinforcementBreakdown: null,
        fortifiesRemaining: 1,
        mustTradeInCards: false,
        reachableFortifyGroups: [],
      },
    }

    it('voegt de rolnaam en "actief" toe aan de statusregel zolang het herkomstland in bezit is', () => {
      const state = { ...stateInProgress, players: [{ ...fixtureState.players[0], roleId: 'generaal', isRoleActive: true }, fixtureState.players[1]] }

      render(
        <PhonePlayerHeader state={state} me={state.players[0]} phase={GamePhaseDto.InProgress} tradeInCards={vi.fn()} error={null} />,
      )

      expect(screen.getByText('Aanvallen · Generaal · actief')).toBeInTheDocument()
    })

    it('toont "inactief" zodra het herkomstland niet meer in bezit is', () => {
      const state = { ...stateInProgress, players: [{ ...fixtureState.players[0], roleId: 'generaal', isRoleActive: false }, fixtureState.players[1]] }

      render(
        <PhonePlayerHeader state={state} me={state.players[0]} phase={GamePhaseDto.InProgress} tradeInCards={vi.fn()} error={null} />,
      )

      expect(screen.getByText('Aanvallen · Generaal · inactief')).toBeInTheDocument()
    })

    it('laat de statusregel ongemoeid zonder rol (rollen uit, of nog niet toegewezen)', () => {
      render(
        <PhonePlayerHeader state={stateInProgress} me={stateInProgress.players[0]} phase={GamePhaseDto.InProgress} tradeInCards={vi.fn()} error={null} />,
      )

      expect(screen.getByText('Aanvallen')).toBeInTheDocument()
    })
  })

  describe('taak 6 — vrijwillig inleggen alleen zichtbaar tijdens Versterken', () => {
    const cards = [
      { id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' },
      { id: 'c2', territoryId: 'alberta', symbol: 'symbol-1' },
      { id: 'c3', territoryId: 'ontario', symbol: 'symbol-1' },
    ]

    const stateWithPhase = (turnPhase: TurnPhaseDto) => ({
      ...fixtureState,
      phase: GamePhaseDto.InProgress,
      players: [
        { ...fixtureState.players[0], hand: cards, hasTradeableCardSet: true },
        fixtureState.players[1],
      ],
      turnState: {
        activePlayerId: 'bob',
        turnPhase,
        armiesRemaining: 0,
        pendingCombat: null,
        timer: { remainingMs: 90_000, isPaused: false },
        reinforcementBreakdown: null,
        fortifiesRemaining: 1,
        mustTradeInCards: false,
        reachableFortifyGroups: [],
      },
    })

    it('verbergt de "Leg 3 kaarten in"-knop in browse-modus buiten Versterken, ook met een geldige set', async () => {
      const state = stateWithPhase(TurnPhaseDto.Fortify)

      render(
        <PhonePlayerHeader state={state} me={state.players[0]} phase={GamePhaseDto.InProgress} tradeInCards={vi.fn()} error={null} />,
      )

      // `/Mijn kaarten/` i.p.v. exacte match: het handaantal-badge (hier 3, uit `cards`)
      // rendert vóór het label in de DOM, dus de toegankelijke naam is "3 Mijn kaarten".
      await userEvent.click(screen.getByRole('button', { name: /Mijn kaarten/ }))

      expect(screen.queryByRole('button', { name: 'Leg 3 kaarten in' })).not.toBeInTheDocument()
    })

    it('toont de "Leg 3 kaarten in"-knop in browse-modus tijdens Versterken met een geldige set', async () => {
      const state = stateWithPhase(TurnPhaseDto.Reinforce)

      render(
        <PhonePlayerHeader state={state} me={state.players[0]} phase={GamePhaseDto.InProgress} tradeInCards={vi.fn()} error={null} />,
      )

      await userEvent.click(screen.getByRole('button', { name: /Mijn kaarten/ }))

      expect(screen.getByRole('button', { name: 'Leg 3 kaarten in' })).toBeInTheDocument()
    })
  })
})
