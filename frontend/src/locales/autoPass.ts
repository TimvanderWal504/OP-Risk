import type { LocaleTree } from '../i18n/types'

/**
 * Auto-pass op de telefoon (DESIGN.md § Auto-pass, FO §11.1/§11.2): de host-actie in Spelinfo › Stand,
 * de bevestiging, het eigen scherm van een speler op auto-pass en de melding voor de nieuwe host. De
 * zinnen in het verloop staan in `actionTicker.ts`. Teksten noemen de speler bij naam, nooit "hij"/"zij".
 */
export const autoPass = {
  /** Kenmerk na de naam (TV-spelerslijst en Stand) en de host-knop op een Stand-rij. */
  badge: { nl: 'Auto-pass', en: 'Auto-pass' },
  button: { nl: 'Auto-pass', en: 'Auto-pass' },
  /** Toegankelijke naam van die knop: elke rij toont dezelfde tekst, dus de speler hoort erin. */
  buttonFor: { nl: '{{name}} op auto-pass zetten', en: 'Put {{name}} on auto-pass' },
  confirm: {
    title: { nl: '{{name}} op auto-pass zetten?', en: 'Put {{name}} on auto-pass?' },
    turns: {
      nl: 'De server speelt de beurten van {{name}}: versterken aan het front, niet aanvallen.',
      en: "The server plays {{name}}'s turns: reinforcing the front, no attacks.",
    },
    defence: {
      nl: '{{name}} verdedigt automatisch met het maximum.',
      en: '{{name}} defends automatically with the maximum.',
    },
    return: {
      nl: '{{name}} is terug zodra de app weer verbinding maakt.',
      en: '{{name}} is back as soon as the app reconnects.',
    },
    cancel: { nl: 'Annuleren', en: 'Cancel' },
    submit: { nl: 'Op auto-pass zetten', en: 'Put on auto-pass' },
  },
  screen: {
    title: { nl: 'Je staat op auto-pass', en: "You're on auto-pass" },
    body: {
      nl: 'De server speelt je beurten en verdedigt voor je. Je gebieden en legers blijven staan.',
      en: 'The server plays your turns and defends for you. Your territories and armies stay put.',
    },
    return: { nl: 'Ik ben terug', en: "I'm back" },
  },
  /** Neutrale toast, alleen voor de nieuwe host bij een overdracht die zijn telefoon ziet gebeuren. */
  nowHost: { nl: 'Je bent nu host', en: "You're now the host" },
} satisfies LocaleTree
