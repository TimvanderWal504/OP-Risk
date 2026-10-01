import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op MapSummaryDto.mapId / de mapnaam onder `data/maps/` (FO §4.5). Welke kaarten er
 * bestaan en hoeveel gebieden ze hebben komt van `GET /maps`; alleen naam en omschrijving
 * worden hier vertaald, via `tDynamic(`${mapId}.name`, 'maps')`. `{{territoryCount}}` vult
 * de aanroeper in met het aantal van de server.
 */
export const maps = {
  'standaard-43': {
    name: { nl: 'Standaard', en: 'Standard' },
    description: {
      nl: '{{territoryCount}} gebieden, de klassieke opzet met Nieuw-Zeeland.',
      en: '{{territoryCount}} territories, the classic layout with New Zealand.',
    },
  },
  'wereld-49': {
    name: { nl: 'Wereld', en: 'World' },
    description: {
      nl: '{{territoryCount}} gebieden, met onder meer Hawaï, de Azoren en de Filipijnen.',
      en: '{{territoryCount}} territories, including Hawaii, the Azores and the Philippines.',
    },
  },
} satisfies LocaleTree
