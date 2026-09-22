import type { LocaleTree } from '../i18n/types'

/** Gedeelde knoppen, generieke labels en generieke states — gevuld per feature tijdens Fase 2. */
export const common = {
  actions: {
    join: { nl: 'Deelnemen', en: 'Join' },
    next: { nl: 'Volgende ›', en: 'Next ›' },
    removePlayer: { nl: 'Verwijder speler', en: 'Remove player' },
  },
  badges: {
    comingSoon: { nl: 'binnenkort', en: 'coming soon' },
  },
  tv: {
    brand: { nl: 'OPERATIE ATLAS', en: 'OPERATION ATLAS' },
    subtitle: { nl: 'CAMPAGNE-TERMINAL', en: 'CAMPAIGN TERMINAL' },
  },
  stepper: {
    decrement: { nl: '{{label}} verlagen', en: 'Decrease {{label}}' },
    increment: { nl: '{{label}} verhogen', en: 'Increase {{label}}' },
  },
  dice: {
    ariaLabel: { nl: 'Dobbelsteen {{value}}', en: 'Die {{value}}' },
  },
  playerHeader: {
    hostBadge: { nl: 'Host', en: 'Host' },
    actions: {
      cards: { nl: 'Mijn kaarten', en: 'My cards' },
      mission: { nl: 'Mijn missie', en: 'My mission' },
      info: { nl: 'Spelinfo', en: 'Game info' },
    },
    // Plan-rollen B4: eigen rol/boost-status als extra segment op de statusregel
    // ("Aanvallen · Generaal · actief") — kleine letters, geen kicker-hoofdlettergebruik,
    // zodat het aansluit bij de omringende zin-stijl status-tekst i.p.v. de uppercase badge.
    roleActive: { nl: 'actief', en: 'active' },
    roleInactive: { nl: 'inactief', en: 'inactive' },
  },
} satisfies LocaleTree
