import type { LocaleTree } from '../i18n/types'

/** Join-flow op de telefoon (FO §3): naam → kleur → rol → wachtkamer. */
export const join = {
  appTitle: { nl: 'OPERATIE ATLAS', en: 'OPERATION ATLAS' },
  name: {
    title: { nl: 'Hoe heet je?', en: 'What is your name?' },
    sub: { nl: 'Zo herkennen de anderen je aan tafel.', en: 'This is how the others recognise you.' },
    placeholder: { nl: 'Jouw naam', en: 'Your name' },
  },
  color: {
    title: { nl: 'Kies je kleur', en: 'Choose your color' },
    sub: {
      nl: 'Bezette kleuren zijn geblokkeerd. Wie het eerst komt…',
      en: 'Taken colours are blocked. First come, first served.',
    },
    taken: { nl: 'Bezet', en: 'Taken' },
    confirm: { nl: 'Kies deze kleur', en: 'Pick this colour' },
  },
  role: {
    title: { nl: 'Kies je rol', en: 'Choose your role' },
    ariaLabel: { nl: 'Kies je rol', en: 'Choose your role' },
    sub: {
      nl: 'Elke rol geeft een openbare bonus zolang je het herkomstland bezit. Al gekozen rollen zijn geblokkeerd.',
      en: 'Each role grants a public bonus while you hold its home country. Roles already taken are blocked.',
    },
    taken: { nl: 'Bezet', en: 'Taken' },
    confirm: { nl: 'Kies deze rol', en: 'Pick this role' },
    pickFirst: { nl: 'Kies eerst een rol', en: 'Pick a role first' },
  },
  wait: {
    title: { nl: 'Je bent aangemeld', en: "You're signed up" },
    noColor: { nl: 'geen kleur', en: 'no color' },
    playersPresent_one: { nl: '{{count}} speler aanwezig', en: '{{count}} player present' },
    playersPresent_other: { nl: '{{count}} spelers aanwezig', en: '{{count}} players present' },
    waitingForHost: { nl: 'Wachten tot de host het spel start…', en: 'Waiting for the host to start the game…' },
  },
  hostWait: {
    kicker: { nl: 'Spel aangemaakt', en: 'Game created' },
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
