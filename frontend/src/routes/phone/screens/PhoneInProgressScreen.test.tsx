import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TurnPhaseDto } from '../../../types/GameState'
import { fixtureProps, fixtureState } from './phoneScreenFixture'
import { PhoneInProgressScreen } from './PhoneInProgressScreen'
import { resolvePhoneTurnPhaseScreen } from './phoneTurnPhaseScreens'
import { PhoneReinforceScreen } from './PhoneReinforceScreen'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'

const baseTurnState = {
  activePlayerId: 'alice',
  armiesRemaining: 3,
  pendingCombat: null,
  timer: null,
  reinforcementBreakdown: null,
}

describe('resolvePhoneTurnPhaseScreen', () => {
  it('koppelt Reinforce aan PhoneReinforceScreen', () => {
    expect(resolvePhoneTurnPhaseScreen(TurnPhaseDto.Reinforce)).toBe(PhoneReinforceScreen)
  })

  it('valt terug op de placeholder voor Attack/Fortify (nog niet gebouwd) en een onbekende/ontbrekende fase', () => {
    expect(resolvePhoneTurnPhaseScreen(TurnPhaseDto.Attack)).toBe(PhonePlaceholderScreen)
    expect(resolvePhoneTurnPhaseScreen(TurnPhaseDto.Fortify)).toBe(PhonePlaceholderScreen)
    expect(resolvePhoneTurnPhaseScreen(undefined)).toBe(PhonePlaceholderScreen)
    expect(resolvePhoneTurnPhaseScreen(99 as TurnPhaseDto)).toBe(PhonePlaceholderScreen)
  })
})

describe('PhoneInProgressScreen', () => {
  it('rendert het Reinforce-scherm zodra turnState.turnPhase Reinforce is', () => {
    render(
      <PhoneInProgressScreen
        {...fixtureProps({
          state: {
            ...fixtureState,
            territories: [{ territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 2 }],
            turnState: { ...baseTurnState, turnPhase: TurnPhaseDto.Reinforce },
          },
        })}
      />,
    )

    expect(screen.getByText('Verdeel je legers')).toBeInTheDocument()
  })

  it('valt terug op de placeholder zolang turnState ontbreekt', () => {
    render(<PhoneInProgressScreen {...fixtureProps({ state: { ...fixtureState, turnState: null } })} />)

    expect(screen.queryByText('Verdeel je legers')).not.toBeInTheDocument()
  })
})
