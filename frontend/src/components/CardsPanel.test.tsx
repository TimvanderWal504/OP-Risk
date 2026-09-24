import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CardsPanel } from './CardsPanel'

const hand = [
  { id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' },
  { id: 'c2', territoryId: 'alberta', symbol: 'symbol-1' },
  { id: 'c3', territoryId: 'ontario', symbol: 'symbol-1' },
  { id: 'c4', territoryId: 'ukraine', symbol: 'symbol-2' },
]

// `useTerritoryOutlines` fetcht de omlijningen-GeoJSON; hier alleen relevant dat het paneel
// zonder crash rendert terwijl die fetch loopt/faalt — de tegel toont dan gewoon een leeg
// derde deel (zie `TerritoryCardTile.test.tsx` voor de omlijning-inhoud zelf).
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CardsPanel', () => {
  it('toont de leeg-tekst wanneer de hand leeg is (browse-modus)', () => {
    render(
      <CardsPanel
        hand={[]}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={false}
        mustTradeInCards={false}
        initialMode="browse"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    expect(
      screen.getByText('Nog geen kaarten. Verover in een beurt minstens één gebied en je trekt er een.'),
    ).toBeInTheDocument()
  })

  it('houdt het raster boven-uitgelijnd (content-start) zodat tegels niet uitrekken bij weinig kaarten', () => {
    const { container } = render(
      <CardsPanel
        hand={[hand[0]]}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={false}
        mustTradeInCards={false}
        initialMode="browse"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('content-start')
  })

  it('toont alle handkaarten in browse-modus en markeert een eigen gebied', () => {
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set(['alaska'])}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="browse"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.getByText('Alberta')).toBeInTheDocument()
  })

  it('schakelt van browse naar trade via de "Leg 3 kaarten in"-knop', async () => {
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="browse"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Leg 3 kaarten in' }))

    expect(screen.getAllByRole('checkbox')).toHaveLength(hand.length)
  })

  it('staat de bevestigknop pas toe bij precies 3 geselecteerde kaarten', async () => {
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="trade"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    const confirmButton = screen.getByRole('button', { name: 'Inleggen' })
    expect(confirmButton).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', { name: /Alaska/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Alberta/ }))
    expect(confirmButton).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', { name: /Ontario/ }))
    expect(confirmButton).toBeEnabled()
  })

  it('blokkeert verdere selectie zodra er al 3 gekozen zijn, geselecteerde tegels blijven togglebaar', async () => {
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="trade"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    await userEvent.click(screen.getByRole('checkbox', { name: /Alaska/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Alberta/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Ontario/ }))

    const fourth = screen.getByRole('checkbox', { name: /Oekraïne/ })
    expect(fourth).toBeDisabled()

    const first = screen.getByRole('checkbox', { name: /Alaska/ })
    expect(first).toBeEnabled()
    await userEvent.click(first)
    expect(fourth).toBeEnabled()
  })

  it('roept onTradeInCards met de 3 geselecteerde kaart-ids aan en sluit daarna', async () => {
    const onTradeInCards = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="trade"
        onTradeInCards={onTradeInCards}
        onClose={onClose}
        error={null}
      />,
    )

    await userEvent.click(screen.getByRole('checkbox', { name: /Alaska/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Alberta/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Ontario/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Inleggen' }))

    expect(onTradeInCards).toHaveBeenCalledWith(['c1', 'c2', 'c3'])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('toont geen sluit-/overslaanknop en de verplicht-copy zolang mustTradeInCards waar is', () => {
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards
        initialMode="trade"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    expect(screen.getByText('Je hebt 5 of meer kaarten — inleggen is verplicht.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Niet inleggen' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sluiten' })).not.toBeInTheDocument()
  })

  it('sluit via de "Sluiten"-knop in browse-modus wanneer niet verplicht', async () => {
    const onClose = vi.fn()
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="browse"
        onTradeInCards={vi.fn()}
        onClose={onClose}
        error={null}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('toont de setregel en een selectieteller die meetelt in trade-modus (impeccable-kritiek 2026-09-21)', async () => {
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="trade"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    expect(
      screen.getByText('3 kaarten met hetzelfde symbool, of 1 van elk symbool — een Joker vervangt elk symbool.'),
    ).toBeInTheDocument()
    expect(screen.getByText('0/3 geselecteerd')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: /Alaska/ }))
    expect(screen.getByText('1/3 geselecteerd')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: /Alberta/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Ontario/ }))
    expect(screen.getByText('3/3 geselecteerd')).toBeInTheDocument()
  })

  it('toont geen selectieteller of setregel in browse-modus', () => {
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="browse"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error={null}
      />,
    )

    expect(screen.queryByText(/geselecteerd/)).not.toBeInTheDocument()
    expect(
      screen.queryByText('3 kaarten met hetzelfde symbool, of 1 van elk symbool — een Joker vervangt elk symbool.'),
    ).not.toBeInTheDocument()
  })

  it('toont een servergeweigerde-set-foutmelding wanneer meegegeven', () => {
    render(
      <CardsPanel
        hand={hand}
        myTerritoryIds={new Set()}
        hasTradeableCardSet={true}
        mustTradeInCards={false}
        initialMode="trade"
        onTradeInCards={vi.fn()}
        onClose={vi.fn()}
        error="Deze kaarten vormen geen geldige set."
      />,
    )

    expect(screen.getByText('Deze kaarten vormen geen geldige set.')).toBeInTheDocument()
  })
})
