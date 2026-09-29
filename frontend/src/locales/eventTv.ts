import type { LocaleTree } from '../i18n/types'

/**
 * De gebeurtenisronde op de TV (DESIGN.md § Event Round): de kaart-overlay, de wachtstaat bij
 * "Legers verwijderen" en de actief-effect-chip. Naam en omschrijving van een kaart komen uit
 * `events.ts`; welke gevolg-regel geldt, bepaalt de soort gevolg die de server meestuurt.
 */
export const eventTv = {
  kicker: { nl: 'Gebeurteniskaart', en: 'Event card' },
  duration: {
    instant: { nl: 'Direct', en: 'Immediate' },
    oneRound: { nl: '1 ronde', en: '1 round' },
  },
  consequence: {
    bonusEveryone: { nl: 'Iedereen krijgt +{{amount}} bij de volgende beurt', en: 'Everyone gets +{{amount}} on their next turn' },
    bonusOne: { nl: '{{names}} krijgt +{{amount}} bij de volgende beurt', en: '{{names}} gets +{{amount}} on their next turn' },
    bonusSome: { nl: '{{names}} krijgen +{{amount}} bij hun volgende beurt', en: '{{names}} get +{{amount}} on their next turn' },
    bonusNobody: { nl: 'Niemand krijgt extra legers', en: 'Nobody gets extra armies' },
    seaBlockade: { nl: 'Zeeroutes dicht tot de volgende ronde', en: 'Sea routes closed until the next round' },
    territoryLock: { nl: '{{territories}} afgesloten tot de volgende ronde', en: '{{territories}} closed until the next round' },
    attrition_one: { nl: 'Iedereen verwijdert {{count}} leger', en: 'Everyone removes {{count}} army' },
    attrition_other: { nl: 'Iedereen verwijdert {{count}} legers', en: 'Everyone removes {{count}} armies' },
  },
  waiting: { nl: 'Nog {{waiting}} van {{total}} spelers kiezen', en: '{{waiting}} of {{total}} players still choosing' },
  chipKicker: { nl: 'Actief effect', en: 'Active effect' },
  chipUntil: { nl: 'tot volgende ronde', en: 'until next round' },
} satisfies LocaleTree
