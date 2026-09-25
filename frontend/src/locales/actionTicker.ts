import type { LocaleTree } from '../i18n/types'

/**
 * Het verloop op de TV (plan-testronde-tv punt 4). Elke zin volgt op de naam van de speler die de
 * actie uitvoert (vet, los gerenderd); alleen `dealt` staat op zichzelf. Een amount van 1 heeft een
 * eigen zin ("een extra leger", besluit gebruiker), zodat er nooit "1 legers" staat. Gebieds- en
 * spelernamen worden geïnterpoleerd; bedragen en totalen komen van de server.
 */
export const actionTicker = {
  title: { nl: 'Verloop', en: 'Feed' },
  latest: { nl: 'Laatste', en: 'Latest' },
  dealt: { nl: 'De gebieden zijn willekeurig verdeeld', en: 'The territories have been dealt at random' },
  claimed: { nl: 'claimt {{territory}}', en: 'claims {{territory}}' },
  granted: { nl: 'krijgt {{count}} legers om te plaatsen', en: 'receives {{count}} armies to place' },
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
} satisfies LocaleTree
