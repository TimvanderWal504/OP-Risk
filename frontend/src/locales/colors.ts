import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op PlayerColorDto.id (Fase 3). Server blijft de bron van waarheid voor
 * welke kleuren bestaan en hun id/hex/symbol; alleen de weergavenaam wordt hier
 * vertaald, via `tDynamic(color.id, 'colors')` — nooit `color.name` rechtstreeks
 * renderen.
 */
export const colors = {
  red: { nl: 'Rood', en: 'Red' },
  blue: { nl: 'Blauw', en: 'Blue' },
  green: { nl: 'Groen', en: 'Green' },
  yellow: { nl: 'Geel', en: 'Yellow' },
  purple: { nl: 'Paars', en: 'Purple' },
  orange: { nl: 'Oranje', en: 'Orange' },
  turquoise: { nl: 'Turquoise', en: 'Turquoise' },
} satisfies LocaleTree
