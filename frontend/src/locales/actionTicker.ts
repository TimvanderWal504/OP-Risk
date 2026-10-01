import type { LocaleTree } from '../i18n/types'

/**
 * Het verloop op de TV (plan-testronde-tv punt 4). Elke zin volgt op de naam van de speler die de
 * actie uitvoert (vet, los gerenderd); alleen `dealt`, `eventDrawn`, `effectExpired*` en de `*Everyone`-zinnen
 * (een samengevatte regel zonder speler) staan op zichzelf. Een amount van 1 heeft een
 * eigen zin ("een extra leger", besluit gebruiker), zodat er nooit "1 legers" staat. Gebieds- en
 * spelernamen worden geïnterpoleerd; bedragen en totalen komen van de server.
 */
export const actionTicker = {
  title: { nl: 'Verloop', en: 'Feed' },
  latest: { nl: 'Laatste', en: 'Latest' },
  dealt: { nl: 'De gebieden zijn willekeurig verdeeld', en: 'The territories have been dealt at random' },
  claimed: { nl: 'claimt {{territory}}', en: 'claims {{territory}}' },
  granted: { nl: 'krijgt {{count}} legers om te plaatsen', en: 'receives {{count}} armies to place' },
  grantedWithBonus: {
    nl: 'krijgt {{count}} legers om te plaatsen, waarvan {{bonus}} door {{event}}',
    en: 'receives {{count}} armies to place, {{bonus}} of them from {{event}}',
  },
  placedOne: {
    nl: 'plaatst een extra leger op {{territory}}. Totaal nu {{total}}.',
    en: 'places an extra army on {{territory}}. Total now {{total}}.',
  },
  placed: {
    nl: 'plaatst {{count}} legers op {{territory}}. Totaal nu {{total}}.',
    en: 'places {{count}} armies on {{territory}}. Total now {{total}}.',
  },
  traded: { nl: 'legt kaarten in voor {{count}} legers', en: 'trades in cards for {{count}} armies' },
  tradeReverted: {
    nl: 'krijgt de kaarten terug: de inleg van {{count}} legers is niet op tijd geplaatst',
    en: 'gets the cards back: the trade of {{count}} armies was not placed in time',
  },
  attack: {
    nl: 'valt {{defender}} aan in {{to}} vanuit {{from}}. Verlies {{attackerLosses}} tegen {{defenderLosses}}.',
    en: 'attacks {{defender}} in {{to}} from {{from}}. Losses {{attackerLosses}} to {{defenderLosses}}.',
  },
  conquered: {
    nl: 'verovert {{to}} op {{defender}} vanuit {{from}}. Verlies {{attackerLosses}} tegen {{defenderLosses}}.',
    en: 'conquers {{to}} from {{defender}}, attacking from {{from}}. Losses {{attackerLosses}} to {{defenderLosses}}.',
  },
  conqueredMovedOne: {
    nl: 'verovert {{to}} op {{defender}} vanuit {{from}}. Verlies {{attackerLosses}} tegen {{defenderLosses}}, een leger trekt mee. Totaal nu {{total}}.',
    en: 'conquers {{to}} from {{defender}}, attacking from {{from}}. Losses {{attackerLosses}} to {{defenderLosses}}, one army moves in. Total now {{total}}.',
  },
  conqueredMoved: {
    nl: 'verovert {{to}} op {{defender}} vanuit {{from}}. Verlies {{attackerLosses}} tegen {{defenderLosses}}, {{count}} legers trekken mee. Totaal nu {{total}}.',
    en: 'conquers {{to}} from {{defender}}, attacking from {{from}}. Losses {{attackerLosses}} to {{defenderLosses}}, {{count}} armies move in. Total now {{total}}.',
  },
  fortifiedOne: {
    nl: 'verplaatst een leger van {{from}} naar {{to}}. Totaal nu {{total}}.',
    en: 'moves one army from {{from}} to {{to}}. Total now {{total}}.',
  },
  fortified: {
    nl: 'verplaatst {{count}} legers van {{from}} naar {{to}}. Totaal nu {{total}}.',
    en: 'moves {{count}} armies from {{from}} to {{to}}. Total now {{total}}.',
  },
  eliminated: { nl: 'schakelt {{eliminated}} uit', en: 'eliminates {{eliminated}}' },
  lastChanceOpened: {
    nl: 'kan winnen: iedereen krijgt nog één laatste beurt',
    en: 'could win: everyone gets one last turn',
  },
  lastChanceBroken: {
    nl: 'doorbreekt de dreigende overwinning van {{achiever}}',
    en: "breaks {{achiever}}'s looming win",
  },
  eventDrawn: { nl: 'Gebeurteniskaart: {{event}}', en: 'Event card: {{event}}' },
  armiesRemovedOne: { nl: 'staat een leger af door {{event}}', en: 'gives up one army to {{event}}' },
  armiesRemoved: { nl: 'staat {{count}} legers af door {{event}}', en: 'gives up {{count}} armies to {{event}}' },
  armiesRemovedOneEveryone: {
    nl: 'Iedereen staat een leger af door {{event}}',
    en: 'Everyone gives up one army to {{event}}',
  },
  armiesRemovedEveryone: {
    nl: 'Iedereen staat {{count}} legers af door {{event}}',
    en: 'Everyone gives up {{count}} armies to {{event}}',
  },
  armiesRemovedNoneEveryone: {
    nl: 'Niemand heeft legers om af te staan ({{event}})',
    en: 'Nobody has armies to give up ({{event}})',
  },
  // Al zijn gebieden afgesloten (FO §9.2): de pool vervalt (besluit gebruiker 2026-10-01).
  armiesLapsedOne: {
    nl: 'kon een leger nergens kwijt ({{event}})',
    en: 'had nowhere to place one army ({{event}})',
  },
  armiesLapsed: {
    nl: 'kon {{count}} legers nergens kwijt ({{event}})',
    en: 'had nowhere to place {{count}} armies ({{event}})',
  },
  armiesRemovedNone: {
    nl: 'heeft geen legers om af te staan ({{event}})',
    en: 'has no armies to give up ({{event}})',
  },
  eventBonusOneEveryone: {
    nl: 'Iedereen krijgt een extra leger bij de volgende beurt ({{event}})',
    en: 'Everyone gets one extra army on their next turn ({{event}})',
  },
  eventBonusEveryone: {
    nl: 'Iedereen krijgt {{count}} extra legers bij de volgende beurt ({{event}})',
    en: 'Everyone gets {{count}} extra armies on their next turn ({{event}})',
  },
  eventBonusOne: {
    nl: 'krijgt een extra leger bij de volgende beurt ({{event}})',
    en: 'gets one extra army on their next turn ({{event}})',
  },
  eventBonus: {
    nl: 'krijgt {{count}} extra legers bij de volgende beurt ({{event}})',
    en: 'gets {{count}} extra armies on their next turn ({{event}})',
  },
  effectExpired: { nl: '{{event}} is voorbij', en: '{{event}} is over' },
  effectExpiredSea: {
    nl: '{{event}} is voorbij: de zeeroutes zijn weer open',
    en: '{{event}} is over: the sea routes are open again',
  },
  effectExpiredLock: {
    nl: '{{event}} is voorbij: de afgesloten gebieden zijn weer open',
    en: '{{event}} is over: the closed territories are open again',
  },
  // Auto-pass (FO §11.1/§11.2, DESIGN.md § Auto-pass).
  autoPassEnabled: { nl: 'staat op auto-pass', en: 'is on auto-pass' },
  disconnectedToAutoPass: {
    nl: 'is weggevallen en staat op auto-pass',
    en: 'dropped out and is on auto-pass',
  },
  autoPassDisabled: { nl: 'is terug', en: 'is back' },
  hostTransferred: { nl: 'is nu host', en: 'is now the host' },
  autoTurnPlayedOne: {
    nl: 'speelde automatisch: een leger aan het front',
    en: 'played automatically: one army to the front',
  },
  autoTurnPlayed: {
    nl: 'speelde automatisch: {{count}} legers aan het front',
    en: 'played automatically: {{count}} armies to the front',
  },
  autoTurnPlayedWithTradeOne: {
    nl: 'speelde automatisch: legde kaarten in en zette een leger aan het front',
    en: 'played automatically: traded cards and put one army on the front',
  },
  autoTurnPlayedWithTrade: {
    nl: 'speelde automatisch: legde kaarten in en zette {{count}} legers aan het front',
    en: 'played automatically: traded cards and put {{count}} armies on the front',
  },
} satisfies LocaleTree
