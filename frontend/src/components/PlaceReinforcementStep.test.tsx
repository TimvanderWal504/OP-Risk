import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlaceReinforcementStep } from './PlaceReinforcementStep'

const myColor = { id: 'red', name: 'Rood', hex: '#800020', onHex: '#f9a8a8', symbol: 'circle' }

const territoryCatalog = [
  { id: 'alaska', continent: 'north-america' },
  { id: 'alberta', continent: 'north-america' },
  { id: 'ontario', continent: 'north-america' },
  { id: 'ukraine', continent: 'europe' },
  { id: 'western-europe', continent: 'europe' },
]

const myTerritories = [
  { territoryId: 'alaska', ownerPlayerId: 'p1', armyCount: 2 },
  { territoryId: 'ukraine', ownerPlayerId: 'p1', armyCount: 1 },
]

describe('PlaceReinforcementStep', () => {
  it('toont de resterende pool en groepeert eigen gebieden per continent, standaard dichtgeklapt bij 2+ groepen', () => {
    render(
      <PlaceReinforcementStep
        myTerritories={myTerritories}
        myColor={myColor}
        territoryCatalog={territoryCatalog}
        armiesLeft={4}
        breakdown={null}
        onConfirmPlacements={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Noord-Amerika')).toBeInTheDocument()
    expect(screen.getByText('Europa')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument() // Europa: 1 van de 2 gebieden bezeten
    // Standaard dicht: de gebiedsrijen zijn nog niet zichtbaar.
    expect(screen.queryByText('Alaska')).not.toBeInTheDocument()
  })

  it('rendert de enige groep open en zonder chevron als de speler maar op 1 continent zit', () => {
    render(
      <PlaceReinforcementStep
        myTerritories={[myTerritories[0]]}
        myColor={myColor}
        territoryCatalog={territoryCatalog}
        armiesLeft={3}
        breakdown={null}
        onConfirmPlacements={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    const header = screen.getByRole('button', { name: /noord-amerika/i })
    expect(header).toBeDisabled()
  })

  it('staged legers verlagen de resterende pool lokaal en verschijnen als delta, zonder de server aan te roepen', async () => {
    const user = userEvent.setup()
    const onConfirmPlacements = vi.fn()
    render(
      <PlaceReinforcementStep
        myTerritories={[myTerritories[0]]}
        myColor={myColor}
        territoryCatalog={territoryCatalog}
        armiesLeft={3}
        breakdown={null}
        onConfirmPlacements={onConfirmPlacements}
        onEndPhase={vi.fn()}
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
        myTerritories={[myTerritories[0]]}
        myColor={myColor}
        territoryCatalog={territoryCatalog}
        armiesLeft={2}
        breakdown={null}
        onConfirmPlacements={onConfirmPlacements}
        onEndPhase={vi.fn()}
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

  it('toont "Klaar → Aanvallen" en roept onEndPhase aan zodra de server armiesLeft op 0 heeft gezet', async () => {
    const user = userEvent.setup()
    const onEndPhase = vi.fn()
    render(
      <PlaceReinforcementStep
        myTerritories={[myTerritories[0]]}
        myColor={myColor}
        territoryCatalog={territoryCatalog}
        armiesLeft={0}
        breakdown={null}
        onConfirmPlacements={vi.fn()}
        onEndPhase={onEndPhase}
      />,
    )

    const doneButton = screen.getByRole('button', { name: 'Klaar → Aanvallen' })
    expect(doneButton).toBeEnabled()
    await user.click(doneButton)

    expect(onEndPhase).toHaveBeenCalled()
  })

  it('toont de Opbouw-breakdown wanneer aangeleverd', () => {
    render(
      <PlaceReinforcementStep
        myTerritories={[myTerritories[0]]}
        myColor={myColor}
        territoryCatalog={territoryCatalog}
        armiesLeft={3}
        breakdown={{ baseArmies: 3, continentBonus: 0, roleBonus: 0, eventBonus: 0 }}
        onConfirmPlacements={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.getByText('Opbouw')).toBeInTheDocument()
    expect(screen.getByText('Continentbonus')).toBeInTheDocument()
  })
})
