import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op cards.json `themes.<theme>.<symbol>` (kaartvariant standaard-43).
 * Data blijft bron van waarheid voor welke inleg-thema's en symbolen bestaan;
 * alleen de weergavetekst wordt hier vertaald, via
 * `tDynamic(`${theme}.${symbol}`, 'cards')` — nooit de waarde uit
 * cards.json.themes rechtstreeks renderen.
 */
export const cards = {
  classic: {
    'symbol-1': { nl: 'Infanterie', en: 'Infantry' },
    'symbol-2': { nl: 'Cavalerie', en: 'Cavalry' },
    'symbol-3': { nl: 'Artillerie', en: 'Artillery' },
    joker: { nl: 'Joker', en: 'Joker' },
  },
  modern: {
    'symbol-1': { nl: 'Infanterie', en: 'Infantry' },
    'symbol-2': { nl: 'Pantser', en: 'Armor' },
    'symbol-3': { nl: 'Drone', en: 'Drone' },
    joker: { nl: 'Joker', en: 'Joker' },
  },
} satisfies LocaleTree
