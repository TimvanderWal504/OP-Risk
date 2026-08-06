import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TurnPhaseDto } from '../../../types/GameState'
import { fixtureProps, fixtureState } from './phoneScreenFixture'
import { PhoneReinforceScreen } from './PhoneReinforceScreen'

const reinforceState = {
  ...fixtureState,
  territories: [{ territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 2 }],
  turnState: {
    activePlayerId: 'alice',
    turnPhase: TurnPhaseDto.Reinforce,
    armiesRemaining: 3,
    pendingCombat: null,
    timer: { remainingMs: 120_000, isPaused: false },
    reinforcementBreakdown: { baseArmies: 3, continentBonus: 0, roleBonus: 0, eventBonus: 0 },
  },
}

describe('PhoneReinforceScreen', () => {
  it('laat verdelen zodra jij aan de beurt bent', () => {
    render(<PhoneReinforceScreen {...fixtureProps({ state: reinforceState })} />)

    expect(screen.getByText('Verdeel je legers')).toBeInTheDocument()
  })

  it('toont wie er aan de beurt is zolang dat een ander is', () => {
    render(
      <PhoneReinforceScreen
        {...fixtureProps({
          state: { ...reinforceState, turnState: { ...reinforceState.turnState, activePlayerId: 'bob' } },
        })}
      />,
    )

    expect(screen.getByText(/Aan de beurt Bob/)).toBeInTheDocument()
    expect(screen.queryByText('Verdeel je legers')).not.toBeInTheDocument()
  })

  it('valt terug op de placeholder zolang er nog geen turnState is', () => {
    render(<PhoneReinforceScreen {...fixtureProps({ state: { ...reinforceState, turnState: null } })} />)

    expect(screen.queryByText('Verdeel je legers')).not.toBeInTheDocument()
  })
})
