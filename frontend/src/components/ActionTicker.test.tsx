import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ActionTicker } from './ActionTicker'
import { fixtureState } from '../routes/tv/screens/tvScreenFixture'
import { RecentActionKindDto, type GameStateDto, type RecentActionDto } from '../types/GameState'

const action = (overrides: Partial<RecentActionDto> & Pick<RecentActionDto, 'kind'>): RecentActionDto => ({
  sequence: 1,
  playerId: 'alice',
  otherPlayerId: null,
  territoryId: null,
  fromTerritoryId: null,
  amount: null,
  total: null,
  attackerLosses: null,
  defenderLosses: null,
  ...overrides,
})

const state = (...recentActions: RecentActionDto[]): GameStateDto => ({ ...fixtureState, recentActions })

/** De zinnen van de items in weergavevolgorde (alleen de eerste kopie van de band). */
const items = () => screen.getAllByTestId('action-ticker-item').map((item) => item.lastElementChild?.textContent)

describe('ActionTicker', () => {
  it('rendert niets zonder acties', () => {
    const { container } = render(<ActionTicker state={state()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('toont de titel en de nieuwste actie vooraan, gemarkeerd als laatste', () => {
    render(
      <ActionTicker
        state={state(
          action({ kind: RecentActionKindDto.TerritoryClaimed, sequence: 2, playerId: 'bob', territoryId: 'peru' }),
          action({ kind: RecentActionKindDto.TerritoryClaimed, sequence: 1, territoryId: 'brazil' }),
        )}
      />,
    )

    expect(screen.getByText('Verloop')).toBeInTheDocument()
    expect(items()).toEqual(['Bob claimt Peru', 'Alice claimt Brazilië'])
    const [newest, older] = screen.getAllByTestId('action-ticker-item')
    expect(newest).toHaveTextContent('Laatste')
    expect(older).not.toHaveTextContent('Laatste')
  })

  it('zet de band er twee keer in voor een naadloze lus, de tweede verborgen voor voorleessoftware', () => {
    render(<ActionTicker state={state(action({ kind: RecentActionKindDto.TerritoryClaimed, territoryId: 'peru' }))} />)

    const band = screen.getByTestId('action-ticker-band')
    expect(band.children).toHaveLength(2)
    expect(band.children[1]).toHaveAttribute('aria-hidden', 'true')
  })

  it('zonder gemeten breedte (geen layout) staat de band stil', () => {
    render(<ActionTicker state={state(action({ kind: RecentActionKindDto.TerritoryClaimed, territoryId: 'peru' }))} />)

    expect(screen.getByTestId('action-ticker-band').style.animation).toBe('none')
  })

  describe('met gemeten breedtes', () => {
    const lane = 1000
    let content = 0

    beforeEach(() => {
      vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(() => lane)
      vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(() => content)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('staat stil zolang het verloop op de baan past', () => {
      content = lane
      render(<ActionTicker state={state(action({ kind: RecentActionKindDto.TerritoryClaimed, territoryId: 'peru' }))} />)

      const band = screen.getByTestId('action-ticker-band')
      expect(band.style.animation).toBe('none')
      expect(band.style.getPropertyValue('--ticker-lane')).toBe(`${lane}px`)
    })

    it('loopt van rechts binnen en daarna door zodra het verloop breder is dan de baan', () => {
      content = lane + 1
      render(<ActionTicker state={state(action({ kind: RecentActionKindDto.TerritoryClaimed, territoryId: 'peru' }))} />)

      expect(screen.getByTestId('action-ticker-band').style.animation).toContain('atlasTickerIn')
    })
  })

  it.each<[string, RecentActionDto, string]>([
    ['de willekeurige verdeling, zonder speler', action({ kind: RecentActionKindDto.TerritoriesDealt, playerId: null }), 'De gebieden zijn willekeurig verdeeld'],
    ['de beurtstart', action({ kind: RecentActionKindDto.ReinforcementsGranted, amount: 7 }), 'Alice krijgt 7 legers om te plaatsen'],
    ['één geplaatst leger', action({ kind: RecentActionKindDto.ArmiesPlaced, territoryId: 'brazil', amount: 1, total: 3 }), 'Alice plaatst een extra leger op Brazilië. Totaal nu 3.'],
    ['meerdere geplaatste legers', action({ kind: RecentActionKindDto.ArmiesPlaced, territoryId: 'brazil', amount: 3, total: 8 }), 'Alice plaatst 3 legers op Brazilië. Totaal nu 8.'],
    ['een kaarteninleg', action({ kind: RecentActionKindDto.CardsTraded, amount: 6 }), 'Alice legt kaarten in voor 6 legers'],
    ['een teruggedraaide inleg', action({ kind: RecentActionKindDto.CardTradeReverted, amount: 6 }), 'Alice krijgt de kaarten terug: de inleg van 6 legers is niet op tijd geplaatst'],
    [
      'een lopende belegering',
      action({ kind: RecentActionKindDto.Attack, otherPlayerId: 'bob', territoryId: 'peru', fromTerritoryId: 'brazil', attackerLosses: 1, defenderLosses: 2 }),
      'Alice valt Bob aan in Peru vanuit Brazilië. Verlies 1 tegen 2.',
    ],
    [
      'een verovering vóór het meeverplaatsen',
      action({ kind: RecentActionKindDto.Conquered, otherPlayerId: 'bob', territoryId: 'peru', fromTerritoryId: 'brazil', attackerLosses: 0, defenderLosses: 3 }),
      'Alice verovert Peru op Bob vanuit Brazilië. Verlies 0 tegen 3.',
    ],
    [
      'een verovering met meeverplaatsen',
      action({ kind: RecentActionKindDto.Conquered, otherPlayerId: 'bob', territoryId: 'peru', fromTerritoryId: 'brazil', attackerLosses: 0, defenderLosses: 3, amount: 3, total: 3 }),
      'Alice verovert Peru op Bob vanuit Brazilië. Verlies 0 tegen 3, 3 legers trekken mee. Totaal nu 3.',
    ],
    [
      'een verplaatsing',
      action({ kind: RecentActionKindDto.Fortified, territoryId: 'peru', fromTerritoryId: 'brazil', amount: 4, total: 6 }),
      'Alice verplaatst 4 legers van Brazilië naar Peru. Totaal nu 6.',
    ],
    ['een uitschakeling', action({ kind: RecentActionKindDto.PlayerEliminated, otherPlayerId: 'bob' }), 'Alice schakelt Bob uit'],
    ['een laatste-kans-venster', action({ kind: RecentActionKindDto.LastChanceOpened }), 'Alice kan winnen: iedereen krijgt nog één laatste beurt'],
    ['een doorbroken laatste kans', action({ kind: RecentActionKindDto.LastChanceBroken, playerId: 'bob', otherPlayerId: 'alice' }), 'Bob doorbreekt de dreigende overwinning van Alice'],
  ])('beschrijft %s', (_, recentAction, sentence) => {
    render(<ActionTicker state={state(recentAction)} />)

    expect(items()).toEqual([sentence])
  })
})
