import type { LocaleTree } from '../i18n/types'

/**
 * Gekeyed op RoleSummaryDto.id (Fase 3, FO §8). Server blijft de bron van
 * waarheid voor welke rollen bestaan, hun effect en herkomstterritorium;
 * alleen naam/flavourtekst worden hier vertaald, via
 * `tDynamic(`${role.id}.name`, 'roles')` / `tDynamic(`${role.id}.description`, 'roles')`
 * — nooit `role.name`/`role.description` rechtstreeks renderen.
 */
export const roles = {
  president: {
    name: { nl: 'President', en: 'President' },
    description: {
      nl: 'USA! USA! USA!: +1 leger per beurt zolang je Oost-VS bezit.',
      en: 'USA! USA! USA!: +1 army per turn as long as you hold Eastern United States.',
    },
  },
  generaal: {
    name: { nl: 'Generaal', en: 'General' },
    description: {
      nl: 'Laat het Ming-Dynasty herrijzen: herwerp 1 verloren dobbelsteen per beurt zolang je China bezit.',
      en: 'Let the Ming Dynasty rise again: reroll 1 lost die per turn as long as you hold China.',
    },
  },
  safariranger: {
    name: { nl: 'Safariranger', en: 'Safari Ranger' },
    description: {
      nl: 'Via de nek van een giraffe kan je een pad door 1 vijandelijk gebied heen aanleggen, zolang je Congo bezit.',
      en: 'Via the neck of a giraffe you can build a path through 1 enemy territory, as long as you hold Congo.',
    },
  },
  diplomaat: {
    name: { nl: 'Diplomaat', en: 'Diplomat' },
    description: {
      nl: 'Diplomacy under a cup of tea!: +2 extra legers bij het inleveren van een kaartenset, zolang je Groot Brittanië bezit.',
      en: 'Diplomacy under a cup of tea!: +2 extra armies when trading in a card set, as long as you hold Great Britain.',
    },
  },
  smokkelaar: {
    name: { nl: 'Smokkelaar', en: 'Smuggler' },
    description: {
      nl: 'Invoegen zit in ons bloed, of het nu goedschiks of kwaadschiks gaat: Mag bij Verplaatsen 2 keer verplaatsen in plaats van 1, zolang je Noord-Afrika bezit.',
      en: 'Smuggling runs in our blood, one way or another: may Fortify twice instead of once, as long as you hold North Africa.',
    },
  },
  admiraal: {
    name: { nl: 'Admiraal', en: 'Admiral' },
    description: {
      nl: 'Legers verdwijnen naar de Gulag? Niet onder jouw bewind: Herwerp 1 verloren dobbelsteen per beurt zolang je de Oeral bezit.',
      en: 'Armies vanishing to the Gulag? Not under your rule: reroll 1 lost die per turn as long as you hold Ural.',
    },
  },
  kolonist: {
    name: { nl: 'Kolonist', en: 'Colonist' },
    description: {
      nl: 'Dit lijkt ons een goede plek om ons te vestigen: +1 leger per beurt zolang je Western Australia bezit.',
      en: 'This looks like a good place to settle: +1 army per turn as long as you hold Western Australia.',
    },
  },
  aboriginal: {
    name: { nl: 'Aboriginal', en: 'Aboriginal' },
    description: {
      nl: 'Generaties kennis van het land verkleinen de kans op een slechte worp: herwerp 1 verloren dobbelsteen per beurt zolang je Eastern Australia bezit.',
      en: 'Generations of knowledge of the land reduce the odds of a bad roll: reroll 1 lost die per turn as long as you hold Eastern Australia.',
    },
  },
  samurai: {
    name: { nl: 'Samurai', en: 'Samurai' },
    description: {
      nl: 'Krijgersdiscipline: herwerp 1 verloren dobbelsteen per beurt zolang je Japan bezit.',
      en: 'Warrior discipline: reroll 1 lost die per turn as long as you hold Japan.',
    },
  },
  inca: {
    name: { nl: 'Inca', en: 'Inca' },
    description: {
      nl: 'Het uitgebreide Inca-wegennet maakt 2 verplaatsingen in plaats van 1 mogelijk, zolang je Peru bezit.',
      en: 'The extensive Inca road network allows 2 moves instead of 1, as long as you hold Peru.',
    },
  },
  cowboy: {
    name: { nl: 'Cowboy', en: 'Cowboy' },
    description: {
      nl: 'Snelle trekker: herwerp 1 verloren dobbelsteen per beurt zolang je Western United States bezit.',
      en: 'Quick on the draw: reroll 1 lost die per turn as long as you hold Western United States.',
    },
  },
  viking: {
    name: { nl: 'Viking', en: 'Viking' },
    description: {
      nl: 'Plundertochten leveren +1 leger per beurt op, zolang je Scandinavië bezit.',
      en: 'Raiding expeditions yield +1 army per turn, as long as you hold Scandinavia.',
    },
  },
  pharaoh: {
    name: { nl: 'Pharaoh', en: 'Pharaoh' },
    description: {
      nl: 'De rijkdom van Egypte levert +2 extra legers op bij het inleveren van een kaartenset, zolang je Egypte bezit.',
      en: 'The riches of Egypt yield +2 extra armies when trading in a card set, as long as you hold Egypt.',
    },
  },
  tsaar: {
    name: { nl: 'Tsaar', en: 'Tsar' },
    description: {
      nl: 'Heerschappij over een immens rijk levert +1 leger per beurt op, zolang je Ukraine bezit.',
      en: 'Rule over an immense empire yields +1 army per turn, as long as you hold Ukraine.',
    },
  },
  maori: {
    name: { nl: 'Maori', en: 'Maori' },
    description: {
      nl: 'Ervaren navigators en krijgers herwerpen 1 verloren dobbelsteen per beurt, zolang je New Zealand bezit. Alleen beschikbaar op kaartvarianten met Nieuw-Zeeland.',
      en: 'Experienced navigators and warriors reroll 1 lost die per turn, as long as you hold New Zealand. Only available on map variants that include New Zealand.',
    },
  },
} satisfies LocaleTree
