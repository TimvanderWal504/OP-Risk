import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameInfoStandings } from './GameInfoStandings'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'
import type { GameStateDto } from '../types/GameState'

const [alice, bob] = fixtureState.players
const carol = { ...bob, id: 'carol', name: 'Carol', colorId: 'green' }

const state = (overrides: Partial<GameStateDto> = {}): GameStateDto => ({
  ...fixtureState,
  players: [alice, bob, carol],
  turnOrder: ['alice', 'bob', 'carol'],
  territories: [
    { territoryId: 'a1', ownerPlayerId: 'alice', armyCount: 3 },
    { territoryId: 'b1', ownerPlayerId: 'bob', armyCount: 2 },
    { territoryId: 'b2', ownerPlayerId: 'bob', armyCount: 2 },
    { territoryId: 'c1', ownerPlayerId: 'carol', armyCount: 1 },
    { territoryId: 'c2', ownerPlayerId: 'carol', armyCount: 1 },
  ],
  ...overrides,
})

/** De spelersnamen in weergavevolgorde. */
const order = () => screen.getAllByText(/^(Alice|Bob|Carol)/).map((element) => element.textContent?.replace(/\s*\(.*\)$/, '').trim())

describe('GameInfoStandings', () => {
  it('sorteert op gebieden, bij gelijke stand op legers, en toont gebieden en legers per speler', () => {
    render(<GameInfoStandings state={state()} me={alice} />)

    // Bob en Carol hebben allebei 2 gebieden; Bob heeft meer legers (4 tegen 2).
    expect(order()).toEqual(['Bob', 'Carol', 'Alice'])
    expect(screen.getByText('2 gebieden · 4 legers')).toBeInTheDocument()
    expect(screen.getByText('1 gebieden · 3 legers')).toBeInTheDocument()
  })

  it('valt bij volledig gelijke stand terug op de beurtvolgorde', () => {
    const tied = state({
      territories: [
        { territoryId: 'a1', ownerPlayerId: 'alice', armyCount: 1 },
        { territoryId: 'b1', ownerPlayerId: 'bob', armyCount: 1 },
        { territoryId: 'c1', ownerPlayerId: 'carol', armyCount: 1 },
      ],
      turnOrder: ['carol', 'alice', 'bob'],
    })
    render(<GameInfoStandings state={tied} me={alice} />)

    expect(order()).toEqual(['Carol', 'Alice', 'Bob'])
  })

  it('toont kaarten pas vanaf 1, en de continenten in bezit met bonus', () => {
    const withExtras = state({
      players: [alice, { ...bob, handCount: 3 }, carol],
      continents: [
        { id: 'australia', bonus: 2, ownerPlayerId: 'bob' },
        { id: 'asia', bonus: 7, ownerPlayerId: null },
      ],
    })
    render(<GameInfoStandings state={withExtras} me={alice} />)

    expect(screen.getByText('2 gebieden · 4 legers · 3 kaarten')).toBeInTheDocument()
    expect(screen.queryByText(/0 kaarten/)).not.toBeInTheDocument()
    expect(screen.getByText('Australië +2')).toBeInTheDocument()
    expect(screen.queryByText(/Azië/)).not.toBeInTheDocument()
  })

  it('zet een uitgeschakelde speler gedimd onderaan met "Uitgeschakeld"', () => {
    const withEliminated = state({ players: [alice, { ...bob, isEliminated: true }, carol] })
    render(<GameInfoStandings state={withEliminated} me={alice} />)

    expect(order().at(-1)).toBe('Bob')
    expect(screen.getByText('Uitgeschakeld')).toBeInTheDocument()
    expect(screen.getByText('Bob').closest('[style*="opacity"]')).toHaveStyle({ opacity: '0.5' })
  })

  it('markeert de eigen rij en toont nooit een missie', () => {
    const withMission = state({ players: [{ ...alice, missionId: 'territory-24' }, bob, carol] })
    render(<GameInfoStandings state={withMission} me={withMission.players[0]} />)

    expect(screen.getByText('(Jij)')).toBeInTheDocument()
    expect(screen.queryByText(/territory-24|24 gebieden/i)).not.toBeInTheDocument()
  })
})
