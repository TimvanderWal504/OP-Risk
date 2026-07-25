import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op ContinentDto.id / continents.json `id` (kaartvariant
 * standaard-43). Data blijft bron van waarheid voor welke continenten
 * bestaan en hun bonus; alleen de weergavenaam wordt hier vertaald, via
 * `tDynamic(continent.id, 'continents')` — nooit het `name`-veld uit
 * continents.json rechtstreeks renderen.
 */
export const continents = {
  'north-america': { nl: 'Noord-Amerika', en: 'North America' },
  'south-america': { nl: 'Zuid-Amerika', en: 'South America' },
  europe: { nl: 'Europa', en: 'Europe' },
  africa: { nl: 'Afrika', en: 'Africa' },
  asia: { nl: 'Azië', en: 'Asia' },
  australia: { nl: 'Australië', en: 'Australia' },
} satisfies LocaleTree
