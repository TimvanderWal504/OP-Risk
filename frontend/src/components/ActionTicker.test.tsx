import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionTicker } from './ActionTicker'
import { fixtureState } from '../routes/tv/screens/tvScreenFixture'
import { RecentActionKindDto, type GameStateDto, type RecentActionDto } from '../types/GameState'

const claimed = (sequence: number, territoryId: string, playerId = 'alice'): RecentActionDto => ({
  sequence,
  kind: RecentActionKindDto.TerritoryClaimed,
  playerId,
  otherPlayerId: null,
  territoryId,
  fromTerritoryId: null,
  amount: null,
  total: null,
  attackerLosses: null,
  defenderLosses: null,
  eventId: null,
  eventBonus: null, cardsTradedInTurn: false,
})

const state = (...newestFirst: RecentActionDto[]): GameStateDto => ({ ...fixtureState, recentActions: newestFirst })

/** De zinnen van de items van links naar rechts. */
const items = () => screen.getAllByTestId('action-ticker-item').map((item) => item.lastElementChild?.textContent)

describe('ActionTicker', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rendert niets zonder acties', () => {
    const { container } = render(<ActionTicker state={state()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('zet de nieuwste links en de oudere rechts ervan, met één vaste "Laatste"-kicker vóór de rij', () => {
    render(<ActionTicker state={state(claimed(2, 'peru', 'bob'), claimed(1, 'brazil'))} />)

    expect(screen.getByText('Verloop')).toBeInTheDocument()
    expect(items()).toEqual(['Bob claimt Peru', 'Alice claimt Brazilië'])
    expect(screen.getAllByText('Laatste')).toHaveLength(1)
    // Buiten de regels: een kicker die meeverhuist, laat de vorige regel krimpen en de rij springen.
    for (const item of screen.getAllByTestId('action-ticker-item')) expect(item).not.toHaveTextContent('Laatste')
  })

  it('rendert elke regel één keer, zonder tweede kopie voor een lus', () => {
    render(<ActionTicker state={state(claimed(1, 'peru'))} />)

    expect(screen.getByTestId('action-ticker-row').children).toHaveLength(1)
  })

  describe('inkomst van een nieuwe regel', () => {
    const animate = vi.fn()

    function stubAnimations() {
      animate.mockClear()
      Object.assign(HTMLElement.prototype, { animate, getAnimations: () => [] })
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200)
    }

    afterEach(() => {
      Reflect.deleteProperty(HTMLElement.prototype, 'animate')
      Reflect.deleteProperty(HTMLElement.prototype, 'getAnimations')
    })

    it('animeert niet bij het eerste renderen', () => {
      stubAnimations()

      render(<ActionTicker state={state(claimed(2, 'peru'), claimed(1, 'brazil'))} />)

      expect(animate).not.toHaveBeenCalled()
    })

    it('schuift de rij rustig over de breedte van de nieuwe regel, zonder invervagen', () => {
      stubAnimations()
      const { rerender } = render(<ActionTicker state={state(claimed(1, 'brazil'))} />)

      rerender(<ActionTicker state={state(claimed(2, 'peru'), claimed(1, 'brazil'))} />)

      expect(animate).toHaveBeenCalledWith(
        [{ transform: 'translateX(-200px)' }, { transform: 'none' }],
        expect.objectContaining({ duration: 700 }),
      )
      expect(animate).toHaveBeenCalledTimes(1)
    })

    it('animeert niet als alleen de bovenste regel bijwerkt', () => {
      stubAnimations()
      const placed = (total: number): RecentActionDto => ({
        ...claimed(2, 'peru'),
        kind: RecentActionKindDto.ArmiesPlaced,
        amount: total - 1,
        total,
      })
      const { rerender } = render(<ActionTicker state={state(placed(3), claimed(1, 'brazil'))} />)

      rerender(<ActionTicker state={state(placed(4), claimed(1, 'brazil'))} />)

      expect(animate).not.toHaveBeenCalled()
    })

    it('staat meteen op zijn plek onder prefers-reduced-motion', () => {
      stubAnimations()
      vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }))
      const { rerender } = render(<ActionTicker state={state(claimed(1, 'brazil'))} />)

      rerender(<ActionTicker state={state(claimed(2, 'peru'), claimed(1, 'brazil'))} />)

      expect(animate).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })
  })
})
