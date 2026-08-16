import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TurnPhaseDto } from '../../../types/GameState'
import { fixtureProps, fixtureState } from './phoneScreenFixture'
import { PhoneFortifyScreen } from './PhoneFortifyScreen'

const fortifyState = {
  ...fixtureState,
  territories: [
    { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 3 },
    { territoryId: 'ontario', ownerPlayerId: 'alice', armyCount: 2 },
  ],
  turnState: {
    activePlayerId: 'alice',
    turnPhase: TurnPhaseDto.Fortify,
    armiesRemaining: 0,
    pendingCombat: null,
    timer: { remainingMs: 60_000, isPaused: false },
    reinforcementBreakdown: null,
    hasFortified: false,
    reachableFortifyGroups: [['alaska', 'ontario']],
  },
}

describe('PhoneFortifyScreen', () => {
  it('laat de verplaats-flow zien zodra jij aan de beurt bent', () => {
    render(<PhoneFortifyScreen {...fixtureProps({ state: fortifyState })} />)

    expect(screen.getByText('Verplaats vanuit')).toBeInTheDocument()
  })

  it('toont wie er aan de beurt is zolang dat een ander is', () => {
    render(
      <PhoneFortifyScreen
        {...fixtureProps({
          state: { ...fortifyState, turnState: { ...fortifyState.turnState, activePlayerId: 'bob' } },
        })}
      />,
    )

    expect(screen.getByText(/Aan de beurt: Bob/)).toBeInTheDocument()
    expect(screen.queryByText('Verplaats vanuit')).not.toBeInTheDocument()
  })

  it('valt terug op de placeholder zolang er nog geen turnState is', () => {
    render(<PhoneFortifyScreen {...fixtureProps({ state: { ...fortifyState, turnState: null } })} />)

    expect(screen.queryByText('Verplaats vanuit')).not.toBeInTheDocument()
  })

  it('toont meteen de done-weergave als hasFortified al server-waar is', () => {
    render(
      <PhoneFortifyScreen
        {...fixtureProps({
          state: { ...fortifyState, turnState: { ...fortifyState.turnState, hasFortified: true } },
        })}
      />,
    )

    expect(screen.getByText('Je hebt deze beurt al verplaatst.')).toBeInTheDocument()
  })
})
