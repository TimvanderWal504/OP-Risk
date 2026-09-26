import type { LocaleTree } from '../i18n/types'

/** Openingsscherm van de telefoon-app (`routes/phone/HomePage.tsx`). */
export const home = {
  title: { nl: 'OPERATIE ATLAS', en: 'OPERATION ATLAS' },
  joinCode: {
    title: { nl: 'Spelcode', en: 'Game code' },
    placeholder: { nl: 'bv. ATLAS7', en: 'e.g. ATLAS7' },
  },
  createCard: {
    title: { nl: 'Nieuw spel starten', en: 'Start a new game' },
    description: {
      nl: 'Jij wordt de host en stelt het spel in.',
      en: 'You become the host and configure the game.',
    },
  },
  joinCard: {
    title: { nl: 'Deelnemen aan een spel', en: 'Join a game' },
    description: { nl: 'Scan de QR-code op de TV.', en: 'Scan the QR code on the TV.' },
  },
  tvCard: {
    title: { nl: 'TV koppelen', en: 'Pair the TV' },
    description: {
      nl: 'Dit scherm wordt het speelbord en toont een QR-code voor de host.',
      en: 'This screen becomes the game board and shows a QR code for the host.',
    },
  },
  pairTvCard: {
    title: { nl: 'Code van de TV invoeren', en: 'Enter the TV code' },
    description: {
      nl: 'Lukt scannen niet? De code staat onder de QR-code op de TV.',
      en: "Can't scan? The code is shown under the QR code on the TV.",
    },
  },
  scan: {
    button: { nl: 'QR-code scannen', en: 'Scan QR code' },
    title: { nl: 'QR-code scannen', en: 'Scan QR code' },
    description: {
      nl: 'Richt de camera op de QR-code op de TV.',
      en: 'Point the camera at the QR code on the TV.',
    },
    typeCode: { nl: 'Code typen', en: 'Type the code' },
    notAGameQr: {
      nl: 'Dit is geen QR-code van een spel. Scan de code in de lobby op de TV.',
      en: "This isn't a game QR code. Scan the code in the lobby on the TV.",
    },
    errors: {
      denied: {
        nl: 'Geen toegang tot de camera. Sta het toe in je browser, of typ de code.',
        en: 'No access to the camera. Allow it in your browser, or type the code.',
      },
      unavailable: {
        nl: 'De camera kon niet worden geopend. Typ de code.',
        en: "The camera couldn't be opened. Type the code.",
      },
    },
  },
  footer: {
    playerCount: { nl: '2 t/m 7 spelers · lokaal netwerk', en: '2 to 7 players · local network' },
  },
} satisfies LocaleTree
