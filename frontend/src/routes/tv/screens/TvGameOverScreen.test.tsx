import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GamePhaseDto } from '../../../types/GameState'
import { TvGameOverScreen } from './TvGameOverScreen'
import { fixtureState } from './tvScreenFixture'

const finishedState = { ...fixtureState, phase: GamePhaseDto.Finished }

describe('TvGameOverScreen', () => {
  it('toont de winnaar-kop en -naam, plus de eindscore-tabel met alle spelers in turn-order', () => {
    render(
      <TvGameOverScreen
        state={{ ...finishedState, winners: ['alice'] }}
        orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(screen.getByText('GEWONNEN')).toBeInTheDocument()
    expect(screen.getByText('Eindscore')).toBeInTheDocument()
    // Alice staat zowel in de winnaar-hero als in de eindscore-tabel.
    expect(screen.getAllByText('Alice').length).toBe(2)
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('toont winnaar met "Voltooid" status en niet-winner met "Niet gehaald"', () => {
    render(
      <TvGameOverScreen
        state={{ ...finishedState, winners: ['alice'] }}
        orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(screen.getByText('Voltooid')).toBeInTheDocument()
    expect(screen.getByText('Niet gehaald')).toBeInTheDocument()
  })

  it('toont geen eindscore-tabel wanneer turnOrder leeg is, maar wel de winnaar-hero', () => {
    const emptyTurnOrderState = { ...finishedState, turnOrder: [], winners: ['alice'] }
    render(
      <TvGameOverScreen
        state={emptyTurnOrderState}
        orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(screen.getByText('GEWONNEN')).toBeInTheDocument()
    expect(screen.getAllByText('Alice').length).toBe(1)
    expect(screen.queryByText('Eindscore')).not.toBeInTheDocument()
  })

  it('valt terug op neutrale tekst wanneer zowel winners als turnOrder leeg/onbekend zijn', () => {
    const emptyState = { ...finishedState, turnOrder: [], winners: [] }
    render(
      <TvGameOverScreen
        state={emptyState}
        orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(screen.getByText('Spel afgelopen')).toBeInTheDocument()
    expect(screen.queryByText('GEWONNEN')).not.toBeInTheDocument()
  })

  it('slaat een onbekende speler-id in turnOrder over i.p.v. te crashen', () => {
    const stateWithUnknownPlayer = { ...finishedState, turnOrder: ['onbekend', 'alice', 'bob'], winners: ['alice'] }
    render(
      <TvGameOverScreen
        state={stateWithUnknownPlayer}
        orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(screen.getAllByText('Alice').length).toBe(2)
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('toont de naam zonder badge als de speler wel bestaat maar de kleur niet', () => {
    const stateWithBrokenColor = {
      ...finishedState,
      winners: ['alice'],
      players: [{ ...finishedState.players[0], colorId: 'onbekende-kleur' }, finishedState.players[1]],
    }

    render(
      <TvGameOverScreen
        state={stateWithBrokenColor}
        orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(screen.getAllByText('Alice').length).toBe(2)
  })

  it('toont de missie-kolom met alleen de omschrijving zodra minstens één speler een missionId heeft', () => {
    const stateWithMissions = {
      ...finishedState,
      winners: ['alice'],
      players: [
        { ...finishedState.players[0], missionId: 'territory-24' },
        { ...finishedState.players[1], missionId: 'territory-18-min2' },
      ],
    }

    render(
      <TvGameOverScreen
        state={stateWithMissions}
        orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(screen.getByText('Missie')).toBeInTheDocument()
    expect(screen.getByText(/Bezit op enig moment 24 gebieden/)).toBeInTheDocument()
    expect(screen.queryByText('Bezit 24 gebieden')).not.toBeInTheDocument()
  })

  it('toont geen missie-kolom wanneer geen enkele speler een missionId heeft', () => {
    render(
      <TvGameOverScreen
        state={{ ...finishedState, winners: ['alice'] }}
        orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(screen.queryByText('Missie')).not.toBeInTheDocument()
  })
})
