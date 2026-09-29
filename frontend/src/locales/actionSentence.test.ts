import { describe, expect, it } from 'vitest'
import { i18next } from '../i18n'
import { actionActor, actionSentence } from './actionSentence'
import { fixtureState } from '../routes/tv/screens/tvScreenFixture'
import { EventDurationDto, EventEffectKindDto, RecentActionKindDto, type RecentActionDto } from '../types/GameState'

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
  eventId: null,
  eventBonus: null,
  ...overrides,
})

/** Naam en zin samen, zoals TV en telefoon ze tonen. */
function line(recentAction: RecentActionDto): string {
  const { actor } = actionActor(recentAction, fixtureState)
  const sentence = actionSentence(recentAction, fixtureState, i18next.getFixedT('nl', 'actionTicker'))

  return actor ? `${actor.name} ${sentence}` : sentence
}

describe('actionSentence', () => {
  it.each<[string, RecentActionDto, string]>([
    ['de willekeurige verdeling, zonder speler', action({ kind: RecentActionKindDto.TerritoriesDealt, playerId: null }), 'De gebieden zijn willekeurig verdeeld'],
    ['een claim', action({ kind: RecentActionKindDto.TerritoryClaimed, territoryId: 'peru' }), 'Alice claimt Peru'],
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
    ['een getrokken gebeurteniskaart, zonder speler', action({ kind: RecentActionKindDto.EventDrawn, playerId: null, eventId: 'griepgolf' }), 'Gebeurteniskaart: Griepgolf'],
    ['één afgestaan leger', action({ kind: RecentActionKindDto.ArmiesRemoved, amount: 1, eventId: 'pensioengolf' }), 'Alice staat een leger af door Pensioengolf'],
    ['meerdere afgestane legers', action({ kind: RecentActionKindDto.ArmiesRemoved, amount: 3, eventId: 'epidemie-in-de-steden' }), 'Alice staat 3 legers af door Epidemie in de steden'],
    ['geen legers om af te staan', action({ kind: RecentActionKindDto.ArmiesRemoved, amount: 0, eventId: 'epidemie-in-de-steden' }), 'Alice heeft geen legers om af te staan (Epidemie in de steden)'],
    ['een bonus van meerdere legers', action({ kind: RecentActionKindDto.EventBonusGranted, amount: 2, eventId: 'babyboom' }), 'Alice krijgt 2 extra legers bij de volgende beurt (Babyboom)'],
    ['een bonus van één leger', action({ kind: RecentActionKindDto.EventBonusGranted, amount: 1, eventId: 'bevolkingsgroei' }), 'Alice krijgt een extra leger bij de volgende beurt (Bevolkingsgroei)'],
    ['een bonus voor iedereen', action({ kind: RecentActionKindDto.EventBonusGranted, playerId: null, amount: 2, eventId: 'babyboom' }), 'Iedereen krijgt 2 extra legers bij de volgende beurt (Babyboom)'],
    ['iedereen staat automatisch een leger af', action({ kind: RecentActionKindDto.ArmiesRemoved, playerId: null, amount: 1, eventId: 'pensioengolf' }), 'Iedereen staat een leger af door Pensioengolf'],
    ['niemand kan iets missen', action({ kind: RecentActionKindDto.ArmiesRemoved, playerId: null, amount: 0, eventId: 'griepgolf' }), 'Niemand heeft legers om af te staan (Griepgolf)'],
    ['een beurtstart met bonus', action({ kind: RecentActionKindDto.ReinforcementsGranted, amount: 5, eventBonus: 2, eventId: 'babyboom' }), 'Alice krijgt 5 legers om te plaatsen, waarvan 2 door Babyboom'],
  ])('beschrijft %s', (_, recentAction, expected) => {
    expect(line(recentAction)).toBe(expected)
  })

  /** De staart van "is voorbij" volgt de soort gevolg die de server meestuurt, niet de id. */
  it.each<[string, string, EventEffectKindDto, string]>([
    ['een zeeblokkade', 'stormachtige-zeeen', EventEffectKindDto.SeaBlockade, 'Stormachtige zeeën is voorbij: de zeeroutes zijn weer open'],
    ['een afgesloten gebied', 'aardbeving-in-china', EventEffectKindDto.TerritoryLock, 'Aardbeving in China is voorbij: de afgesloten gebieden zijn weer open'],
  ])('beschrijft het einde van %s', (_, eventId, effectKind, expected) => {
    const state = { ...fixtureState, events: [{ id: eventId, duration: EventDurationDto.OneRound, effectKind }] }
    const expired = action({ kind: RecentActionKindDto.EffectExpired, playerId: null, eventId })

    expect(actionSentence(expired, state, i18next.getFixedT('nl', 'actionTicker'))).toBe(expected)
  })

  it('geeft een actie zonder speler de neutrale avatar', () => {
    expect(actionActor(action({ kind: RecentActionKindDto.TerritoriesDealt, playerId: null }), fixtureState)).toEqual({
      actor: undefined,
      color: null,
    })
  })
})
