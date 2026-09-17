import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlaceReinforcementStep, type PlaceReinforcementStepProps } from './PlaceReinforcementStep'

const myColor = { id: 'red', name: 'Rood', hex: '#800020', onHex: '#f9a8a8', symbol: 'circle' }

const territoryCatalog = [
  { id: 'alaska', continent: 'north-america', neighborTerritoryIds: [] },
  { id: 'alberta', continent: 'north-america', neighborTerritoryIds: [] },
  { id: 'ontario', continent: 'north-america', neighborTerritoryIds: [] },
  { id: 'ukraine', continent: 'europe', neighborTerritoryIds: [] },
  { id: 'western-europe', continent: 'europe', neighborTerritoryIds: [] },
]

const myTerritories = [
  { territoryId: 'alaska', ownerPlayerId: 'p1', armyCount: 2 },
  { territoryId: 'ukraine', ownerPlayerId: 'p1', armyCount: 1 },
]

/** Basisprops; elke test overschrijft alleen wat zijn gedrag stuurt. */
const defaultProps = (overrides: Partial<PlaceReinforcementStepProps> = {}): PlaceReinforcementStepProps => ({
  myTerritories,
  myColor,
  territoryCatalog,
  armiesLeft: 4,
  breakdown: null,
  hand: [],
  myTerritoryIds: new Set(myTerritories.map((t) => t.territoryId)),
  mustTradeInCards: false,
  onConfirmPlacements: vi.fn(),
  onTradeInCards: vi.fn(),
  onEndPhase: vi.fn(),
  error: null,
  ...overrides,
})

describe('PlaceReinforcementStep', () => {
  it('toont de resterende pool en groepeert eigen gebieden per continent, standaard dichtgeklapt bij 2+ groepen', () => {
    render(<PlaceReinforcementStep {...defaultProps({ armiesLeft: 4 })} />)

    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Noord-Amerika')).toBeInTheDocument()
    expect(screen.getByText('Europa')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument() // Europa: 1 van de 2 gebieden bezeten
    // Standaard dicht: de gebiedsrijen zijn nog niet zichtbaar.
    expect(screen.queryByText('Alaska')).not.toBeInTheDocument()
  })

  it('rendert de enige groep open en zonder chevron als de speler maar op 1 continent zit', () => {
    render(<PlaceReinforcementStep {...defaultProps({ myTerritories: [myTerritories[0]], armiesLeft: 3 })} />)

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    const header = screen.getByRole('button', { name: /noord-amerika/i })
    expect(header).toBeDisabled()
  })

  it('staged legers verlagen de resterende pool lokaal en verschijnen als delta, zonder de server aan te roepen', async () => {
    const user = userEvent.setup()
    const onConfirmPlacements = vi.fn()
    render(
      <PlaceReinforcementStep
        {...defaultProps({ myTerritories: [myTerritories[0]], armiesLeft: 3, onConfirmPlacements })}
      />,
    )

    await user.click(screen.getByRole('button', { name: '+' }))

    expect(screen.getByText('2')).toBeInTheDocument() // resterende pool: 3 - 1
    expect(onConfirmPlacements).not.toHaveBeenCalled()
  })

  it('bevestigt met één samengevoegde call per gebied zodra de hele pool lokaal verdeeld is', async () => {
    const user = userEvent.setup()
    const onConfirmPlacements = vi.fn().mockResolvedValue(undefined)
    render(
      <PlaceReinforcementStep
        {...defaultProps({ myTerritories: [myTerritories[0]], armiesLeft: 2, onConfirmPlacements })}
      />,
    )

    const plusButton = screen.getByRole('button', { name: '+' })
    await user.click(plusButton)
    await user.click(plusButton)

    const confirmButton = screen.getByRole('button', { name: 'Bevestigen' })
    expect(confirmButton).toBeEnabled()
    await user.click(confirmButton)

    expect(onConfirmPlacements).toHaveBeenCalledWith([{ territoryId: 'alaska', amount: 2 }])
  })

  it('roept onEndPhase automatisch aan zodra de server armiesLeft op 0 heeft gezet, zonder een knop te tonen', async () => {
    const onEndPhase = vi.fn()
    render(<PlaceReinforcementStep {...defaultProps({ myTerritories: [myTerritories[0]], armiesLeft: 0, onEndPhase })} />)

    await waitFor(() => expect(onEndPhase).toHaveBeenCalled())
    expect(screen.queryByText('Bevestigen')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Verdeel eerst/)).not.toBeInTheDocument()
  })

  it('toont de Opbouw-breakdown wanneer aangeleverd, incl. de Kaarteninleg-rij alleen bij een positieve bonus', () => {
    render(
      <PlaceReinforcementStep
        {...defaultProps({
          myTerritories: [myTerritories[0]],
          armiesLeft: 3,
          breakdown: { baseArmies: 3, continentBonus: 0, roleBonus: 0, eventBonus: 0, cardTradeBonus: 0 },
        })}
      />,
    )

    expect(screen.getByText('Opbouw')).toBeInTheDocument()
    expect(screen.getByText('Continentbonus')).toBeInTheDocument()
    expect(screen.queryByText('Kaarteninleg')).not.toBeInTheDocument()
  })

  it('toont de Kaarteninleg-rij zodra cardTradeBonus > 0', () => {
    render(
      <PlaceReinforcementStep
        {...defaultProps({
          myTerritories: [myTerritories[0]],
          armiesLeft: 3,
          breakdown: { baseArmies: 3, continentBonus: 0, roleBonus: 0, eventBonus: 0, cardTradeBonus: 4 },
        })}
      />,
    )

    expect(screen.getByText('Kaarteninleg')).toBeInTheDocument()
  })

  it('toont de "Leg kaarten in"-knop pas vanaf 3 kaarten in de hand', () => {
    const twoCards = [
      { id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' },
      { id: 'c2', territoryId: 'ukraine', symbol: 'symbol-2' },
    ]

    render(<PlaceReinforcementStep {...defaultProps({ hand: twoCards })} />)

    expect(screen.queryByRole('button', { name: 'Leg kaarten in' })).not.toBeInTheDocument()
  })

  it('opent het inlegpaneel meteen, zonder ontsnapping, zodra mustTradeInCards waar is', () => {
    const fiveCards = Array.from({ length: 5 }, (_, i) => ({
      id: `c${i}`,
      territoryId: 'alaska',
      symbol: 'symbol-1',
    }))

    render(<PlaceReinforcementStep {...defaultProps({ hand: fiveCards, mustTradeInCards: true })} />)

    expect(screen.getByText('Leg 3 kaarten in')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Niet inleggen' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sluiten' })).not.toBeInTheDocument()
  })
})
