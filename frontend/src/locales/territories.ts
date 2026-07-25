import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op TerritoryDto.territoryId / territories.json `id` (kaartvariant
 * standaard-43). Data blijft bron van waarheid voor welke gebieden bestaan en
 * hun continent/geometrie; alleen de weergavenaam wordt hier vertaald, via
 * `tDynamic(territory.id, 'territories')` — nooit het `name`-veld uit
 * territories.json rechtstreeks renderen.
 */
export const territories = {
  alaska: { nl: 'Alaska', en: 'Alaska' },
  'northwest-territory': { nl: 'Northwest Territory', en: 'Northwest Territory' },
  greenland: { nl: 'Groenland', en: 'Greenland' },
  alberta: { nl: 'Alberta', en: 'Alberta' },
  ontario: { nl: 'Ontario', en: 'Ontario' },
  quebec: { nl: 'Quebec', en: 'Quebec' },
  'western-united-states': { nl: 'Western United States', en: 'Western United States' },
  'eastern-united-states': { nl: 'Eastern United States', en: 'Eastern United States' },
  'central-america': { nl: 'Centraal-Amerika', en: 'Central America' },
  venezuela: { nl: 'Venezuela', en: 'Venezuela' },
  peru: { nl: 'Peru', en: 'Peru' },
  brazil: { nl: 'Brazilië', en: 'Brazil' },
  argentina: { nl: 'Argentinië', en: 'Argentina' },
  iceland: { nl: 'IJsland', en: 'Iceland' },
  'great-britain': { nl: 'Groot-Brittannië', en: 'Great Britain' },
  scandinavia: { nl: 'Scandinavië', en: 'Scandinavia' },
  'western-europe': { nl: 'West-Europa', en: 'Western Europe' },
  'northern-europe': { nl: 'Noord-Europa', en: 'Northern Europe' },
  'southern-europe': { nl: 'Zuid-Europa', en: 'Southern Europe' },
  ukraine: { nl: 'Oekraïne', en: 'Ukraine' },
  'north-africa': { nl: 'Noord-Afrika', en: 'North Africa' },
  egypt: { nl: 'Egypte', en: 'Egypt' },
  'east-africa': { nl: 'Oost-Afrika', en: 'East Africa' },
  congo: { nl: 'Congo', en: 'Congo' },
  'south-africa': { nl: 'Zuid-Afrika', en: 'South Africa' },
  madagascar: { nl: 'Madagaskar', en: 'Madagascar' },
  ural: { nl: 'Oeral', en: 'Ural' },
  siberia: { nl: 'Siberië', en: 'Siberia' },
  yakutsk: { nl: 'Jakoetsk', en: 'Yakutsk' },
  irkutsk: { nl: 'Irkoetsk', en: 'Irkutsk' },
  kamchatka: { nl: 'Kamtsjatka', en: 'Kamchatka' },
  mongolia: { nl: 'Mongolië', en: 'Mongolia' },
  china: { nl: 'China', en: 'China' },
  japan: { nl: 'Japan', en: 'Japan' },
  'middle-east': { nl: 'Midden-Oosten', en: 'Middle East' },
  india: { nl: 'India', en: 'India' },
  siam: { nl: 'Siam', en: 'Siam' },
  afghanistan: { nl: 'Afghanistan', en: 'Afghanistan' },
  indonesia: { nl: 'Indonesië', en: 'Indonesia' },
  'new-guinea': { nl: 'Nieuw-Guinea', en: 'New Guinea' },
  'western-australia': { nl: 'Western Australia', en: 'Western Australia' },
  'eastern-australia': { nl: 'Eastern Australia', en: 'Eastern Australia' },
  'new-zealand': { nl: 'Nieuw-Zeeland', en: 'New Zealand' },
} satisfies LocaleTree
