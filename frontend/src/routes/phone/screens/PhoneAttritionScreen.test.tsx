import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GamePhaseDto, RecentActionKindDto, type GameStateDto, type PendingAttritionDto } from '../../../types/GameState'
import { fixtureProps, fixtureState } from './phoneScreenFixture'
import { PhoneInProgressScreen } from './PhoneInProgressScreen'

const pending = (overrides: Partial<PendingAttritionDto> = {}): PendingAttritionDto => ({
  eventId: 'griepgolf',
  amount: 2,
  chooserPlayerIds: ['alice', 'bob'],
  awaitingPlayerIds: ['alice', 'bob'],
  ...overrides,
})

const attritionState = (overrides: Partial<GameStateDto>): GameStateDto => ({
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  turnState: null,
  territories: [
    { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 4 },
    { territoryId: 'peru', ownerPlayerId: 'bob', armyCount: 1 },
  ],
  ...overrides,
})

const show = (state: GameStateDto, playerId: string) =>
  render(
    <PhoneInProgressScreen
      {...fixtureProps({ state, playerId, me: state.players.find((player) => player.id === playerId)! })}
    />,
  )

describe('PhoneInProgressScreen tijdens "Legers verwijderen"', () => {
  it('stuurt een wachtende kiezer naar het verwijderscherm', () => {
    show(attritionState({ pendingAttrition: pending() }), 'alice')

    expect(screen.getByText('Verwijder 2 legers')).toBeInTheDocument()
  })

  it('laat een kiezer die al koos wachten op de rest, met wat hij afstond', () => {
    show(attritionState({ pendingAttrition: pending({ awaitingPlayerIds: ['bob'] }) }), 'alice')

    expect(screen.getByText('Je hebt 2 legers verwijderd.')).toBeInTheDocument()
    expect(screen.getByText('Wachten op Bob…')).toBeInTheDocument()
  })

  /** Nooit "hoeft niets": wie legers kán missen, moet (besluit gebruiker 2026-09-29). */
  it('noemt de reden als een speler niets kon missen', () => {
    show(
      attritionState({
        pendingAttrition: pending({ chooserPlayerIds: ['alice'], awaitingPlayerIds: ['alice'] }),
        recentActions: [
          {
            sequence: 4,
            kind: RecentActionKindDto.ArmiesRemoved,
            playerId: 'bob',
            otherPlayerId: null,
            territoryId: null,
            fromTerritoryId: null,
            amount: 0,
            total: null,
            attackerLosses: null,
            defenderLosses: null,
            eventId: 'griepgolf',
            eventBonus: null, cardsTradedInTurn: false,
          },
        ],
      }),
      'bob',
    )

    expect(screen.getByText('Je hebt geen legers om te verwijderen: al je gebieden hebben 1 leger.')).toBeInTheDocument()
    expect(screen.getByText('Wachten op Alice…')).toBeInTheDocument()
  })

  /** Review taak 7: een keuze van een ander (nieuwe push) mag de eigen, onbevestigde keuze niet wissen. */
  it('behoudt de eigen keuze als een andere speler intussen bevestigt', () => {
    const before = attritionState({ pendingAttrition: pending(), stateVersion: 7 })
    const { rerender } = show(before, 'alice')

    fireEvent.click(screen.getByRole('button', { name: 'Leger weghalen van Alaska' }))
    expect(screen.getByText('1', { selector: '.text-size8' })).toBeInTheDocument()

    const after = { ...before, stateVersion: 8, pendingAttrition: pending({ awaitingPlayerIds: ['alice'] }) }
    rerender(<PhoneInProgressScreen {...fixtureProps({ state: after, playerId: 'alice', me: after.players[0] })} />)

    expect(screen.getByText('1', { selector: '.text-size8' })).toBeInTheDocument()
  })
})
