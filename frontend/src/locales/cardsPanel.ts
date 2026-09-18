import type { LocaleTree } from '../i18n/types'

/**
 * Chrome-teksten voor het "Mijn kaarten"-paneel op de telefoon (FO §4.4/§5.2/§7) — zelfde
 * opzet als `missionPanel.ts`: eigen namespace per paneel, geen gedeelde sleutels. Dekt zowel
 * het vrijwillige hand-overzicht (browse) als de inleg-stap (trade), zie `CardsPanel.tsx`.
 */
export const cardsPanel = {
  title: { nl: 'Mijn kaarten', en: 'My cards' },
  visibleOnlyToYou: { nl: 'Alleen zichtbaar voor jou.', en: 'Only visible to you.' },
  /**
   * Dekt ook de ≥6-na-eliminatie-situatie midden in Aanvallen — "aan het begin van je beurt"
   * zou daar liegen, dus bewust fase-neutraal geformuleerd.
   */
  intro: {
    nl: 'Territoriumkaarten. Bij 5 of meer moet je inleggen voordat je verder speelt.',
    en: 'Territory cards. With 5 or more you must trade in before you continue.',
  },
  empty: {
    nl: 'Nog geen kaarten. Verover in een beurt minstens één gebied en je trekt er een.',
    en: "No cards yet. Conquer at least one territory in a turn and you'll draw one.",
  },
  jokerLabel: { nl: 'Joker', en: 'Joker' },
  tradeTitle: { nl: 'Leg 3 kaarten in', en: 'Trade in 3 cards' },
  tradeMandatory: {
    nl: 'Je hebt 5 of meer kaarten — inleggen is verplicht.',
    en: 'You have 5 or more cards — trading in is mandatory.',
  },
  tradeConfirm: { nl: 'Inleggen', en: 'Trade in' },
  tradeSkip: { nl: 'Niet inleggen', en: "Don't trade" },
  close: { nl: 'Sluiten', en: 'Close' },
} satisfies LocaleTree
