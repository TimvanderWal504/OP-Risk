import type { LocaleTree } from '../i18n/types'

/**
 * Het "TV-weergave"-paneel op de host-telefoon (plan-testronde-tv punt 2): hoe de TV het spel
 * toont. Fase-onafhankelijk — bereikbaar vanuit de host-lobby (`JoinHostWaitStep`) en de
 * persistente header (`PhonePlayerHeader`).
 */
export const tvDisplay = {
  title: { nl: 'TV-weergave', en: 'TV display' },
  intro: {
    nl: 'Pas aan hoe de TV het spel toont. 50% is de standaard.',
    en: 'Adjust how the TV shows the game. 50% is the default.',
  },
  sections: {
    screen: { nl: 'Scherm', en: 'Screen' },
    dice: { nl: 'Dobbelstenen', en: 'Dice' },
    language: { nl: 'Taal op de TV', en: 'Language on the TV' },
  },
  textScale: { nl: 'Tekstgrootte', en: 'Text size' },
  glassOpacity: { nl: 'Dekking van panelen', en: 'Panel opacity' },
  glassBlur: { nl: 'Vervaging achter panelen', en: 'Blur behind panels' },
  diceScale: { nl: 'Grootte van de dobbelstenen', en: 'Dice size' },
  languages: {
    nl: { nl: 'Nederlands', en: 'Dutch' },
    en: { nl: 'Engels', en: 'English' },
  },
  reset: { nl: 'Standaard', en: 'Default' },
  close: { nl: 'Sluiten', en: 'Close' },
} satisfies LocaleTree
