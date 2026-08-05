import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fixtureProps, fixtureSetupState, fixtureState } from './phoneScreenFixture'
import { PhoneClaimingScreen } from './PhoneClaimingScreen'

const claimingState = {
  ...fixtureState,
  territories: [
    { territoryId: 'alaska', ownerPlayerId: null, armyCount: 0 },
    { territoryId: 'brazil', ownerPlayerId: 'bob', armyCount: 1 },
  ],
  setupState: fixtureSetupState({
    claimableTerritoryIdsByPlayer: { alice: ['alaska'], bob: ['alaska'] },
  }),
}

const territoryCatalog = [
  { id: 'alaska', continent: 'north-america', neighborTerritoryIds: [] },
  { id: 'brazil', continent: 'south-america', neighborTerritoryIds: [] },
]

describe('PhoneClaimingScreen', () => {
  it('toont de claimstap met de door de server aangewezen actieve speler', () => {
    render(<PhoneClaimingScreen {...fixtureProps({ state: claimingState, territoryCatalog })} />)

    expect(screen.getByText('Alaska')).toBeInTheDocument()
  })

  // De server houdt het eigen rol-herkomstland uit de lijst (FO §8.1); een vrij gebied dat er
  // niet in staat mag de speler dus niet aangeboden krijgen.
  it('biedt alleen aan wat de server claimbaar noemt, niet elk vrij gebied', () => {
    render(
      <PhoneClaimingScreen
        {...fixtureProps({
          state: {
            ...claimingState,
            territories: [
              { territoryId: 'alaska', ownerPlayerId: null, armyCount: 0 },
              { territoryId: 'brazil', ownerPlayerId: null, armyCount: 0 },
            ],
            setupState: fixtureSetupState({
              claimableTerritoryIdsByPlayer: { alice: ['alaska'], bob: ['alaska', 'brazil'] },
            }),
          },
          territoryCatalog,
        })}
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.queryByText('Brazilië')).not.toBeInTheDocument()
  })

  it('valt terug op de placeholder als de server geen setup-state meestuurt', () => {
    render(
      <PhoneClaimingScreen
        {...fixtureProps({ state: { ...claimingState, setupState: null }, territoryCatalog })}
      />,
    )

    expect(screen.getByText(/spelbord volgt in een latere bouwplak/i)).toBeInTheDocument()
  })
})
