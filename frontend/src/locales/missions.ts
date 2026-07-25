import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op MissionSummaryDto.id / missions.json `id` (FO §6.1, kaartvariant
 * standaard-43). Data blijft bron van waarheid voor welke missies bestaan en
 * hun type/params/fallback; alleen naam en omschrijving worden hier vertaald,
 * via `tDynamic(`${mission.id}.name`, 'missions')` /
 * `tDynamic(`${mission.id}.description`, 'missions')` — nooit
 * `mission.name`/`mission.description` rechtstreeks renderen.
 */
export const missions = {
  'conquer-asia-south-america': {
    name: { nl: 'Verover Azië en Zuid-Amerika', en: 'Conquer Asia and South America' },
    description: {
      nl: 'Verover alle gebieden van Azië en Zuid-Amerika.',
      en: 'Conquer every territory in Asia and South America.',
    },
  },
  'conquer-europe-australia-plus': {
    name: {
      nl: 'Verover Europa, Australië en 1 continent naar keuze',
      en: 'Conquer Europe, Australia and 1 continent of your choice',
    },
    description: {
      nl: 'Verover alle gebieden van Europa en Australië, plus een derde continent naar keuze.',
      en: 'Conquer every territory in Europe and Australia, plus a third continent of your choice.',
    },
  },
  'conquer-north-america-africa': {
    name: { nl: 'Verover Noord-Amerika en Afrika', en: 'Conquer North America and Africa' },
    description: {
      nl: 'Verover alle gebieden van Noord-Amerika en Afrika.',
      en: 'Conquer every territory in North America and Africa.',
    },
  },
  'conquer-europe-south-america-plus': {
    name: {
      nl: 'Verover Europa, Zuid-Amerika en 1 continent naar keuze',
      en: 'Conquer Europe, South America and 1 continent of your choice',
    },
    description: {
      nl: 'Verover alle gebieden van Europa en Zuid-Amerika, plus een derde continent naar keuze.',
      en: 'Conquer every territory in Europe and South America, plus a third continent of your choice.',
    },
  },
  'conquer-asia-africa': {
    name: { nl: 'Verover Azië en Afrika', en: 'Conquer Asia and Africa' },
    description: {
      nl: 'Verover alle gebieden van Azië en Afrika.',
      en: 'Conquer every territory in Asia and Africa.',
    },
  },
  'conquer-north-america-australia': {
    name: { nl: 'Verover Noord-Amerika en Australië', en: 'Conquer North America and Australia' },
    description: {
      nl: 'Verover alle gebieden van Noord-Amerika en Australië.',
      en: 'Conquer every territory in North America and Australia.',
    },
  },
  'territory-24': {
    name: { nl: 'Bezit 24 gebieden', en: 'Hold 24 territories' },
    description: {
      nl: 'Bezit op enig moment 24 gebieden, ongeacht welke.',
      en: 'Hold 24 territories at once, regardless of which ones.',
    },
  },
  'territory-18-min2': {
    name: {
      nl: 'Bezit 18 gebieden met elk minstens 2 legers',
      en: 'Hold 18 territories with at least 2 armies each',
    },
    description: {
      nl: 'Bezit op enig moment 18 gebieden, elk bezet met minstens 2 legers.',
      en: 'Hold 18 territories at once, each occupied by at least 2 armies.',
    },
  },
  'eliminate-red': {
    name: { nl: 'Schakel de rode speler uit', en: 'Eliminate the red player' },
    description: {
      nl: 'Vernietig alle legers van de rode speler.',
      en: "Destroy all of the red player's armies.",
    },
  },
  'eliminate-blue': {
    name: { nl: 'Schakel de blauwe speler uit', en: 'Eliminate the blue player' },
    description: {
      nl: 'Vernietig alle legers van de blauwe speler.',
      en: "Destroy all of the blue player's armies.",
    },
  },
  'eliminate-green': {
    name: { nl: 'Schakel de groene speler uit', en: 'Eliminate the green player' },
    description: {
      nl: 'Vernietig alle legers van de groene speler.',
      en: "Destroy all of the green player's armies.",
    },
  },
  'eliminate-yellow': {
    name: { nl: 'Schakel de gele speler uit', en: 'Eliminate the yellow player' },
    description: {
      nl: 'Vernietig alle legers van de gele speler.',
      en: "Destroy all of the yellow player's armies.",
    },
  },
  'eliminate-purple': {
    name: { nl: 'Schakel de paarse speler uit', en: 'Eliminate the purple player' },
    description: {
      nl: 'Vernietig alle legers van de paarse speler.',
      en: "Destroy all of the purple player's armies.",
    },
  },
  'eliminate-orange': {
    name: { nl: 'Schakel de oranje speler uit', en: 'Eliminate the orange player' },
    description: {
      nl: 'Vernietig alle legers van de oranje speler.',
      en: "Destroy all of the orange player's armies.",
    },
  },
  'eliminate-turquoise': {
    name: { nl: 'Schakel de turquoise speler uit', en: 'Eliminate the turquoise player' },
    description: {
      nl: 'Vernietig alle legers van de turquoise speler.',
      en: "Destroy all of the turquoise player's armies.",
    },
  },
} satisfies LocaleTree
