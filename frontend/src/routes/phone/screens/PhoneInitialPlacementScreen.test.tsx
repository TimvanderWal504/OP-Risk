import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fixtureProps, fixtureSetupState, fixtureState } from './phoneScreenFixture'
import { PhoneInitialPlacementScreen } from './PhoneInitialPlacementScreen'

const placementState = {
  ...fixtureState,
  territories: [{ territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 1 }],
  setupState: fixtureSetupState({ remainingArmiesByPlayer: { alice: 4, bob: 2 } }),
}

describe('PhoneInitialPlacementScreen', () => {
  it('laat plaatsen zodra jij aan de beurt bent', () => {
    render(<PhoneInitialPlacementScreen {...fixtureProps({ state: placementState })} />)

    expect(screen.getByText('Plaats je legers')).toBeInTheDocument()
  })

  // Het restbudget komt van de server; de client telt het niet zelf uit de state op.
  it('toont het door de server berekende restbudget van de eigen speler', () => {
    render(<PhoneInitialPlacementScreen {...fixtureProps({ state: placementState })} />)

    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('toont wie er aan de beurt is zolang dat een ander is', () => {
    render(
      <PhoneInitialPlacementScreen
        {...fixtureProps({
          state: {
            ...placementState,
            setupState: fixtureSetupState({
              activePlayerId: 'bob',
              remainingArmiesByPlayer: { alice: 4, bob: 2 },
            }),
          },
        })}
      />,
    )

    expect(screen.getByText(/Aan de beurt Bob/)).toBeInTheDocument()
  })

  // Bij een willekeurige verdeling is er geen beurt: de server stuurt activePlayerId null en
  // iedereen plaatst tegelijk. De client leidt dat niet af uit de opstelmodus.
  it('laat iedereen plaatsen zodra de server geen actieve speler aanwijst', () => {
    render(
      <PhoneInitialPlacementScreen
        {...fixtureProps({
          state: {
            ...placementState,
            setupState: fixtureSetupState({
              activePlayerId: null,
              remainingArmiesByPlayer: { alice: 4, bob: 2 },
            }),
          },
        })}
      />,
    )

    expect(screen.getByText('Plaats je legers')).toBeInTheDocument()
  })
})
