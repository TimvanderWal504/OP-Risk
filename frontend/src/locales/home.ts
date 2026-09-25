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
    title: { nl: 'TV opzetten', en: 'Set up the TV' },
    description: {
      nl: 'Gebruik dit scherm als speelbord.',
      en: 'Use this screen as the game board.',
    },
  },
  pairTvCard: {
    title: { nl: 'TV koppelen', en: 'Pair a TV' },
    description: {
      nl: 'Voer de code in die op de TV staat.',
      en: 'Enter the code shown on the TV.',
    },
  },
  footer: {
    playerCount: { nl: '2 t/m 7 spelers · lokaal netwerk', en: '2 to 7 players · local network' },
  },
} satisfies LocaleTree
