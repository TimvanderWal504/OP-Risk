import type { LocaleTree } from '../i18n/types'

/** Join-flow op de telefoon (FO §3): naam → kleur → rol → wachtkamer. */
export const join = {
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
    taken: { nl: 'Bezet', en: 'Taken' },
  },
  wait: {
    title: { nl: 'Je bent aangemeld', en: "You're signed up" },
    noColor: { nl: 'geen kleur', en: 'no color' },
    playersPresent_one: { nl: '{{count}} speler aanwezig', en: '{{count}} player present' },
    playersPresent_other: { nl: '{{count}} spelers aanwezig', en: '{{count}} players present' },
    startGame: { nl: 'Spel starten', en: 'Start game' },
    waitingForPlayers: {
      nl: 'Wachten tot alle spelers klaar zijn (minimaal aantal spelers, iedereen heeft een kleur gekozen).',
      en: 'Waiting for all players to be ready (minimum number of players, everyone has chosen a color).',
    },
    waitingForHost: { nl: 'Wachten tot de host het spel start…', en: 'Waiting for the host to start the game…' },
  },
} satisfies LocaleTree
