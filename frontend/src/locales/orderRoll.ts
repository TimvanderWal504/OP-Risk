import type { LocaleTree } from '../i18n/types'

/** Order-roll-fase op TV en telefoon (FO §2.1): spelersvolgorde bepalen via dobbelworp. */
export const orderRoll = {
  badge: { nl: 'Spelersvolgorde', en: 'Turn order' },
  title: { nl: 'Spelersvolgorde bepalen', en: 'Determine turn order' },
  notRolledYet: { nl: 'Je hebt nog niet gegooid.', en: "You haven't rolled yet." },
  rollButton: { nl: 'Gooien', en: 'Roll' },
  waitingForOthers: { nl: 'Wachten op andere spelers…', en: 'Waiting for other players…' },
  total: { nl: 'Totaal: {{total}}', en: 'Total: {{total}}' },
  waitingForRoll: { nl: 'Wacht op worp…', en: 'Waiting for roll…' },
} satisfies LocaleTree
