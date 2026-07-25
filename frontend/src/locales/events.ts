import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op EventSummaryDto.id / events.json `id` (FO §9.2, kaartvariant
 * standaard-43). Data blijft bron van waarheid voor welke gebeurtenissen
 * bestaan en hun effect/duration; alleen naam en omschrijving worden hier
 * vertaald, via `tDynamic(`${event.id}.name`, 'events')` /
 * `tDynamic(`${event.id}.description`, 'events')` — nooit
 * `event.name`/`event.description` rechtstreeks renderen.
 */
export const events = {
  'goede-oogst': {
    name: { nl: 'Goede oogst', en: 'Good harvest' },
    description: {
      nl: 'Iedereen die een volledig continent bezit krijgt +2 legers.',
      en: 'Everyone who holds an entire continent gets +2 armies.',
    },
  },
  bondgenootschap: {
    name: { nl: 'Bondgenootschap', en: 'Alliance' },
    description: {
      nl: 'Iedereen die een volledig continent bezit krijgt +1 leger.',
      en: 'Everyone who holds an entire continent gets +1 army.',
    },
  },
  'stormachtige-zeeen': {
    name: { nl: 'Stormachtige zeeën', en: 'Stormy seas' },
    description: {
      nl: 'Alle zeeverbindingen zijn deze ronde geblokkeerd.',
      en: 'All sea routes are blocked this round.',
    },
  },
  'beringstraat-dichtgevroren': {
    name: { nl: 'De Beringstraat is dichtgevroren', en: 'The Bering Strait has frozen over' },
    description: {
      nl: 'De zeeroute tussen Alaska en Kamtsjatka is deze ronde geblokkeerd.',
      en: 'The sea route between Alaska and Kamchatka is blocked this round.',
    },
  },
  'noordzee-geblokkeerd': {
    name: { nl: 'De Noordzee is geblokkeerd', en: 'The North Sea is blocked' },
    description: {
      nl: 'De zeeverbindingen tussen Groot-Brittannië en het vasteland zijn deze ronde geblokkeerd.',
      en: 'The sea routes between Great Britain and the mainland are blocked this round.',
    },
  },
  'moesson-in-de-javazee': {
    name: { nl: 'Moesson in de Javazee', en: 'Monsoon in the Java Sea' },
    description: {
      nl: 'De zeeverbindingen rond Indonesië en Nieuw-Guinea zijn deze ronde geblokkeerd.',
      en: 'The sea routes around Indonesia and New Guinea are blocked this round.',
    },
  },
  'piraten-in-de-middellandse-zee': {
    name: { nl: 'Piraten in de Middellandse Zee', en: 'Pirates in the Mediterranean' },
    description: {
      nl: 'De zeeverbindingen tussen Zuid-Europa, Noord-Afrika en Egypte zijn deze ronde geblokkeerd.',
      en: 'The sea routes between Southern Europe, North Africa and Egypt are blocked this round.',
    },
  },
  'cycloon-bij-madagaskar': {
    name: { nl: 'Cycloon bij Madagaskar', en: 'Cyclone near Madagascar' },
    description: {
      nl: 'De zeeverbindingen naar Madagaskar zijn deze ronde geblokkeerd.',
      en: 'The sea routes to Madagascar are blocked this round.',
    },
  },
  'poolstorm-in-het-noorden': {
    name: { nl: 'Poolstorm in het noorden', en: 'Polar storm in the north' },
    description: {
      nl: 'Een zware poolstorm sluit Groenland en IJsland deze ronde volledig af.',
      en: 'A severe polar storm completely seals off Greenland and Iceland this round.',
    },
  },
  'zandstorm-in-de-sahara': {
    name: { nl: 'Zandstorm in de Sahara', en: 'Sandstorm in the Sahara' },
    description: {
      nl: 'Een zandstorm sluit Noord-Afrika deze ronde volledig af.',
      en: 'A sandstorm completely seals off North Africa this round.',
    },
  },
  'overstromingen-in-siam': {
    name: { nl: 'Overstromingen in Siam', en: 'Floods in Siam' },
    description: {
      nl: 'Zware regenval sluit Siam deze ronde volledig af.',
      en: 'Heavy rainfall completely seals off Siam this round.',
    },
  },
  'aardbeving-in-china': {
    name: { nl: 'Aardbeving in China', en: 'Earthquake in China' },
    description: {
      nl: 'Een zware aardbeving sluit China deze ronde volledig af.',
      en: 'A severe earthquake completely seals off China this round.',
    },
  },
  'vulkaanuitbarsting-op-kamtsjatka': {
    name: { nl: 'Vulkaanuitbarsting op Kamtsjatka', en: 'Volcanic eruption on Kamchatka' },
    description: {
      nl: 'Een vulkaanuitbarsting sluit Kamtsjatka deze ronde volledig af.',
      en: 'A volcanic eruption completely seals off Kamchatka this round.',
    },
  },
  'lawines-in-de-oeral': {
    name: { nl: 'Lawines in de Oeral', en: 'Avalanches in the Ural' },
    description: {
      nl: 'Zware lawines sluiten de Oeral deze ronde volledig af.',
      en: 'Severe avalanches completely seal off the Ural this round.',
    },
  },
  'aardverschuiving-in-centraal-amerika': {
    name: { nl: 'Aardverschuiving in Centraal-Amerika', en: 'Landslide in Central America' },
    description: {
      nl: 'Een zware aardverschuiving sluit Centraal-Amerika deze ronde volledig af.',
      en: 'A severe landslide completely seals off Central America this round.',
    },
  },
  'epidemie-in-de-steden': {
    name: { nl: 'Epidemie in de steden', en: 'Epidemic in the cities' },
    description: {
      nl: 'Een besmettelijke ziekte kost iedereen 3 legers.',
      en: 'A contagious disease costs everyone 3 armies.',
    },
  },
  griepgolf: {
    name: { nl: 'Griepgolf', en: 'Flu wave' },
    description: {
      nl: 'Een zware griepgolf kost iedereen 2 legers.',
      en: 'A severe flu wave costs everyone 2 armies.',
    },
  },
  'vergrijzing-in-de-troepenmacht': {
    name: { nl: 'Vergrijzing in de troepenmacht', en: 'Aging armed forces' },
    description: {
      nl: 'Een verouderend leger kost iedereen 2 legers.',
      en: 'An aging army costs everyone 2 armies.',
    },
  },
  pensioengolf: {
    name: { nl: 'Pensioengolf', en: 'Wave of retirements' },
    description: {
      nl: 'Een golf aan pensioneringen kost iedereen 1 leger.',
      en: 'A wave of retirements costs everyone 1 army.',
    },
  },
  'technologische-doorbraak': {
    name: { nl: 'Technologische doorbraak', en: 'Technological breakthrough' },
    description: {
      nl: 'Een technologische doorbraak levert iedereen +2 legers op.',
      en: 'A technological breakthrough gives everyone +2 armies.',
    },
  },
  'industriele-revolutie': {
    name: { nl: 'Industriële revolutie', en: 'Industrial revolution' },
    description: {
      nl: 'Nieuwe industrie levert iedereen +3 legers op.',
      en: 'New industry gives everyone +3 armies.',
    },
  },
  'wapenindustrie-groeit': {
    name: { nl: 'De wapenindustrie groeit', en: 'The arms industry is growing' },
    description: {
      nl: 'Een groeiende wapenindustrie levert iedereen +1 leger op.',
      en: 'A growing arms industry gives everyone +1 army.',
    },
  },
  babyboom: {
    name: { nl: 'Babyboom', en: 'Baby boom' },
    description: {
      nl: 'Een golf aan geboortes levert iedereen +2 legers op.',
      en: 'A wave of births gives everyone +2 armies.',
    },
  },
  bevolkingsgroei: {
    name: { nl: 'Bevolkingsgroei', en: 'Population growth' },
    description: {
      nl: 'Snelle bevolkingsgroei levert iedereen +1 leger op.',
      en: 'Rapid population growth gives everyone +1 army.',
    },
  },
  'geboortegolf-in-de-kolonien': {
    name: { nl: 'Geboortegolf in de koloniën', en: 'Baby boom in the colonies' },
    description: {
      nl: 'Een geboortegolf levert iedereen +3 legers op.',
      en: 'A baby boom gives everyone +3 armies.',
    },
  },
} satisfies LocaleTree
