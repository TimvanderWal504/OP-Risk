import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FortifyFlowStep } from './FortifyFlowStep'

const myColor = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' }

const myTerritories = [
  { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 3 },
  { territoryId: 'brazil', ownerPlayerId: 'alice', armyCount: 1 },
  { territoryId: 'ontario', ownerPlayerId: 'alice', armyCount: 2 },
]

// Alle drie in dezelfde server-groep: de meeste tests gaan over de flow zelf (stepper, terug-
// navigatie, foutafhandeling), niet over filtering — die krijgt zijn eigen test hieronder.
const allConnected = [['alaska', 'brazil', 'ontario']]

describe('FortifyFlowStep', () => {
  it('toont als bron alleen eigen gebieden met minstens 2 legers', () => {
    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={false}
        reachableGroups={allConnected}
        error={null}
        onFortify={vi.fn()}
        onEndTurn={vi.fn()}
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.getByText('Ontario')).toBeInTheDocument()
    expect(screen.queryByText('Brazilië')).not.toBeInTheDocument()
  })

  it('toont als doel alleen de gebieden in dezelfde server-groep als de bron', async () => {
    const user = userEvent.setup()

    // Alaska+Ontario zitten in dezelfde groep, Brazilië in een eigen (server-berekende) groep —
    // vanuit Alaska hoort Brazilië dus niet in de doellijst te staan, ook al is het wel eigen
    // gebied (FO §5.2 wordt server-side afgedwongen, de client filtert alleen op wat binnenkomt).
    const partiallyConnected = [['alaska', 'ontario'], ['brazil']]

    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={false}
        reachableGroups={partiallyConnected}
        error={null}
        onFortify={vi.fn()}
        onEndTurn={vi.fn()}
      />,
    )

    await user.click(screen.getByText('Alaska'))

    expect(screen.getByRole('button', { name: /Ontario/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Brazilië/ })).not.toBeInTheDocument()
    // "Alaska" blijft zichtbaar in de kop ("Verplaats vanuit Alaska") — alleen de doellijst
    // zelf mag het gekozen brongebied niet meer als optie aanbieden.
    expect(screen.queryByRole('button', { name: /Alaska/ })).not.toBeInTheDocument()
  })

  it('klemt het aantal legers tussen 1 en fromArmyCount - 1', async () => {
    const user = userEvent.setup()

    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={false}
        reachableGroups={allConnected}
        error={null}
        onFortify={vi.fn()}
        onEndTurn={vi.fn()}
      />,
    )

    await user.click(screen.getByText('Alaska'))
    await user.click(screen.getByText('Brazilië'))

    // Alaska heeft 3 legers, dus max = 2.
    const plus = screen.getByText('+')
    await user.click(plus)
    await user.click(plus)
    await user.click(plus)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('gaat terug van doel naar bron, en van aantal naar doel', async () => {
    const user = userEvent.setup()

    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={false}
        reachableGroups={allConnected}
        error={null}
        onFortify={vi.fn()}
        onEndTurn={vi.fn()}
      />,
    )

    await user.click(screen.getByText('Alaska'))
    await user.click(screen.getByText('Ander brongebied kiezen'))
    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.getByText('Ontario')).toBeInTheDocument()

    await user.click(screen.getByText('Alaska'))
    await user.click(screen.getByText('Ontario'))
    await user.click(screen.getByText('Ander doelgebied kiezen'))
    expect(screen.getByText('Brazilië')).toBeInTheDocument()
  })

  it('roept onFortify aan met bron, doel en aantal bij bevestigen', async () => {
    const user = userEvent.setup()
    const onFortify = vi.fn().mockResolvedValue(true)

    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={false}
        reachableGroups={allConnected}
        error={null}
        onFortify={onFortify}
        onEndTurn={vi.fn()}
      />,
    )

    await user.click(screen.getByText('Alaska'))
    await user.click(screen.getByText('Ontario'))
    await user.click(screen.getByRole('button', { name: 'Bevestig verplaatsing' }))

    expect(onFortify).toHaveBeenCalledWith('alaska', 'ontario', 1)
  })

  it('blijft bij een mislukte verplaatsing op de aantal-stap met een foutmelding, en laat die verdwijnen bij een ander doel', async () => {
    const user = userEvent.setup()
    const onFortify = vi.fn().mockResolvedValue(false)

    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={false}
        reachableGroups={allConnected}
        error="Er is geen aaneengesloten pad."
        onFortify={onFortify}
        onEndTurn={vi.fn()}
      />,
    )

    await user.click(screen.getByText('Alaska'))
    await user.click(screen.getByText('Brazilië'))
    await user.click(screen.getByRole('button', { name: 'Bevestig verplaatsing' }))

    expect(await screen.findByText('Er is geen aaneengesloten pad.')).toBeInTheDocument()

    // Terug naar doel, ander doel kiezen: de oude fout hoort te verdwijnen zonder een nieuwe
    // aanvraag — de melding is gekoppeld aan de combinatie waarop hij ontstond.
    await user.click(screen.getByText('Ander doelgebied kiezen'))
    await user.click(screen.getByText('Ontario'))

    expect(screen.queryByText('Er is geen aaneengesloten pad.')).not.toBeInTheDocument()
    expect(onFortify).toHaveBeenCalledTimes(1)
  })

  it('roept bij "Beurt beëindigen" op de bronstap onEndTurn aan zonder onFortify, en toont een fout bij falen', async () => {
    const user = userEvent.setup()
    const onFortify = vi.fn()
    const onEndTurn = vi.fn().mockResolvedValue(false)

    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={false}
        reachableGroups={allConnected}
        error="Kan de beurt nu niet beëindigen."
        onFortify={onFortify}
        onEndTurn={onEndTurn}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Beurt beëindigen' }))

    expect(onEndTurn).toHaveBeenCalledTimes(1)
    expect(onFortify).not.toHaveBeenCalled()
    expect(await screen.findByText('Kan de beurt nu niet beëindigen.')).toBeInTheDocument()
  })

  it('toont meteen de done-weergave zodra hasFortified server-waar is (reconnect zonder lokale intentie)', () => {
    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={true}
        reachableGroups={allConnected}
        error={null}
        onFortify={vi.fn()}
        onEndTurn={vi.fn()}
      />,
    )

    expect(screen.getByText('Je hebt deze beurt al verplaatst.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beurt beëindigen' })).toBeInTheDocument()
  })

  it('toont op de done-weergave een foutmelding als onEndTurn daar faalt', async () => {
    const user = userEvent.setup()
    const onEndTurn = vi.fn().mockResolvedValue(false)

    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={true}
        reachableGroups={allConnected}
        error="Kan de beurt nu niet beëindigen."
        onFortify={vi.fn()}
        onEndTurn={onEndTurn}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Beurt beëindigen' }))

    expect(await screen.findByText('Kan de beurt nu niet beëindigen.')).toBeInTheDocument()
  })

  it('disabled de knoppen zolang een aanroep loopt', async () => {
    const user = userEvent.setup()
    let resolveFortify!: (value: boolean) => void
    const onFortify = vi.fn(() => new Promise<boolean>((resolve) => (resolveFortify = resolve)))

    render(
      <FortifyFlowStep
        myTerritories={myTerritories}
        myColor={myColor}
        hasFortified={false}
        reachableGroups={allConnected}
        error={null}
        onFortify={onFortify}
        onEndTurn={vi.fn()}
      />,
    )

    await user.click(screen.getByText('Alaska'))
    await user.click(screen.getByText('Ontario'))
    const confirmButton = screen.getByRole('button', { name: 'Bevestig verplaatsing' })
    await user.click(confirmButton)

    expect(confirmButton).toBeDisabled()

    resolveFortify(true)
  })
})
