import { describe, expect, it } from 'vitest'
import { i18next } from '../i18n'
import { actionActor, actionSentence } from './actionSentence'
import { fixtureState } from '../routes/tv/screens/tvScreenFixture'
import { RecentActionKindDto, type RecentActionDto } from '../types/GameState'

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
  ])('beschrijft %s', (_, recentAction, expected) => {
    expect(line(recentAction)).toBe(expected)
  })

  it('geeft een actie zonder speler de neutrale avatar', () => {
    expect(actionActor(action({ kind: RecentActionKindDto.TerritoriesDealt, playerId: null }), fixtureState)).toEqual({
      actor: undefined,
      color: null,
    })
  })
})
