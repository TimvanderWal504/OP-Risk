import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  EventDurationDto,
  EventEffectKindDto,
  GamePhaseDto,
  RecentActionKindDto,
  type GameStateDto,
  type RecentActionDto,
} from '../../../types/GameState'
import { fixtureState } from './tvScreenFixture'
import { TvEventOverlay } from './TvEventOverlay'

const action = (overrides: Partial<RecentActionDto> & Pick<RecentActionDto, 'kind' | 'sequence'>): RecentActionDto => ({
  playerId: null,
  otherPlayerId: null,
  territoryId: null,
  fromTerritoryId: null,
  amount: null,
  total: null,
  attackerLosses: null,
  defenderLosses: null,
  eventId: null,
  eventBonus: null,
  ...overrides,
})

const state = (overrides: Partial<GameStateDto>): GameStateDto => ({
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  events: [
    { id: 'babyboom', duration: EventDurationDto.Instant, effectKind: EventEffectKindDto.Bonus, amount: null },
    { id: 'goede-oogst', duration: EventDurationDto.Instant, effectKind: EventEffectKindDto.Bonus, amount: null },
    { id: 'stormachtige-zeeen', duration: EventDurationDto.OneRound, effectKind: EventEffectKindDto.SeaBlockade, amount: null },
    { id: 'epidemie-in-de-steden', duration: EventDurationDto.Instant, effectKind: EventEffectKindDto.Attrition, amount: 3 },
  ],
  ...overrides,
})

// De trekking zelf, op het volgnummer dat `show` standaard meegeeft.
const drawn = (eventId: string) => action({ kind: RecentActionKindDto.EventDrawn, sequence: 5, eventId })

const show = (overrides: Partial<GameStateDto>, eventId: string | null, sequence = 5) =>
  render(
    <TvEventOverlay
      state={state(overrides)}
      event={eventId ? { eventId, sequence } : null}
      orderRollThrows={{}}
      lastClaimedTerritoryId={null}
      combat={null}
    />,
  )

describe('TvEventOverlay', () => {
  it('toont kicker, naam, omschrijving, duur en gevolg van de kaart', () => {
    show({}, 'stormachtige-zeeen')

    expect(screen.getByText('Gebeurteniskaart')).toBeInTheDocument()
    expect(screen.getByText('Stormachtige zeeën')).toBeInTheDocument()
    expect(screen.getByText('Alle zeeverbindingen zijn deze ronde geblokkeerd.')).toBeInTheDocument()
    expect(screen.getByText('1 ronde')).toBeInTheDocument()
    expect(screen.getByText('Zeeroutes dicht tot de volgende ronde')).toBeInTheDocument()
  })

  it('noemt "iedereen" als iedereen dezelfde bonus kreeg', () => {
    show(
      {
        recentActions: [
          action({ kind: RecentActionKindDto.EventBonusGranted, sequence: 6, amount: 2, eventId: 'babyboom' }),
          drawn('babyboom'),
        ],
      },
      'babyboom',
    )

    expect(screen.getByText('Iedereen krijgt +2 bij de volgende beurt')).toBeInTheDocument()
  })

  it('noemt de ontvangers van déze trekking, in beurtvolgorde', () => {
    show(
      {
        recentActions: [
          action({ kind: RecentActionKindDto.EventBonusGranted, sequence: 7, amount: 2, playerId: 'bob', eventId: 'goede-oogst' }),
          action({ kind: RecentActionKindDto.EventBonusGranted, sequence: 6, amount: 2, playerId: 'alice', eventId: 'goede-oogst' }),
          drawn('goede-oogst'),
          // Een oudere trekking van dezelfde kaart telt niet mee.
          action({ kind: RecentActionKindDto.EventBonusGranted, sequence: 2, amount: 2, playerId: 'alice', eventId: 'goede-oogst' }),
        ],
      },
      'goede-oogst',
    )

    expect(screen.getByText('Alice en Bob krijgen +2 bij hun volgende beurt')).toBeInTheDocument()
  })

  it('zegt het als niemand bonus kreeg', () => {
    show({ recentActions: [drawn('goede-oogst')] }, 'goede-oogst')

    expect(screen.getByText('Niemand krijgt extra legers')).toBeInTheDocument()
  })

  it('zegt niets over de bonus als de trekking al uit het verloop-venster is geschoven', () => {
    show(
      { recentActions: [action({ kind: RecentActionKindDto.ArmiesPlaced, sequence: 20, playerId: 'alice', amount: 1, total: 4 })] },
      'goede-oogst',
    )

    expect(screen.getByText('Goede oogst')).toBeInTheDocument()
    expect(screen.queryByText('Niemand krijgt extra legers')).not.toBeInTheDocument()
  })

  it('toont bij legerverlies de wachtstaat met een vinkje voor wie al koos', () => {
    const { container } = show(
      { pendingAttrition: { eventId: 'epidemie-in-de-steden', amount: 3, chooserPlayerIds: ['alice', 'bob'], awaitingPlayerIds: ['bob'] } },
      null,
    )

    expect(screen.getByText('Epidemie in de steden')).toBeInTheDocument()
    expect(screen.getByText('Iedereen verwijdert 3 legers')).toBeInTheDocument()
    expect(screen.getByText('Nog 1 van 2 spelers kiezen')).toBeInTheDocument()
    const choosers = container.querySelectorAll('[data-testid="attrition-chooser"]')
    expect([...choosers].map((chooser) => chooser.getAttribute('data-done'))).toEqual(['true', 'false'])
  })

  it('toont bij het uitgaan de laatst getoonde kaart, ook als de keuzes net klaar zijn', () => {
    render(
      <TvEventOverlay
        state={state({ pendingAttrition: null })}
        event={null}
        eventExit={{ shown: { eventId: 'epidemie-in-de-steden', draw: null }, onExited: () => {} }}
        orderRollThrows={{}}
        lastClaimedTerritoryId={null}
        combat={null}
      />,
    )

    expect(screen.getByText('Epidemie in de steden')).toBeInTheDocument()
    expect(screen.getByText('Iedereen verwijdert 3 legers')).toBeInTheDocument()
    expect(screen.queryByText(/spelers kiezen/)).not.toBeInTheDocument()
  })
})
