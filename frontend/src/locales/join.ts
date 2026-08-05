import type { LocaleTree } from '../i18n/types'

/** Join-flow op de telefoon (FO §3): naam → kleur → rol → wachtkamer. */
export const join = {
  appTitle: { nl: 'OPERATIE ATLAS', en: 'OPERATION ATLAS' },
  name: {
    title: { nl: 'Hoe heet je?', en: 'What is your name?' },
    placeholder: { nl: 'Jouw naam', en: 'Your name' },
  },
  color: {
    title: { nl: 'Kies je kleur', en: 'Choose your color' },
    taken: { nl: 'Bezet', en: 'Taken' },
  },
  role: {
    title: { nl: 'Kies je rol', en: 'Choose your role' },
    ariaLabel: { nl: 'Kies je rol', en: 'Choose your role' },
    sub: {
      nl: 'Elke rol geeft een openbare bonus zolang je het herkomstland bezit. Al gekozen rollen zijn geblokkeerd.',
      en: 'Each role grants a public bonus while you hold its home country. Roles already taken are blocked.',
    },
    taken: { nl: 'Bezet', en: 'Taken' },
    confirm: { nl: 'Bevestigen', en: 'Confirm' },
    back: { nl: 'Naam & kleur aanpassen', en: 'Edit name & colour' },
    pickFirst: { nl: 'Kies eerst een rol', en: 'Pick a role first' },
  },
  wait: {
    title: { nl: 'Je zit in de lobby', en: "You're in the lobby" },
    noColor: { nl: 'geen kleur', en: 'no color' },
    playersPresent_one: { nl: '{{count}} speler aangesloten', en: '{{count}} player joined' },
    playersPresent_other: { nl: '{{count}} spelers aangesloten', en: '{{count}} players joined' },
    waitingForHost: { nl: 'Wachten tot de host start…', en: 'Waiting for the host to start…' },
    quoteKicker: { nl: 'Terwijl je wacht', en: 'While you wait' },
  },
  hostWait: {
    title: { nl: 'Wachten op spelers', en: 'Waiting for players' },
    hostBadge: { nl: 'HOST', en: 'HOST' },
    qrHint: {
      nl: 'De QR-code om mee te doen staat op de TV.',
      en: 'The QR code to join is shown on the TV.',
    },
    joinedLabel: { nl: 'Aangesloten', en: 'Joined' },
    startGame: { nl: 'Start spel', en: 'Start game' },
    startGameWait: { nl: 'Wachten op spelers…', en: 'Waiting for players…' },
    waitingForPlayers: {
      nl: 'Minimaal 2 spelers nodig om te starten.',
      en: 'At least 2 players needed to start.',
    },
  },
} satisfies LocaleTree
