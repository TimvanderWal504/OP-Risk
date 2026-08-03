import type { LocaleTree } from '../i18n/types'

/**
 * TV-hoofdbord tijdens `GamePhaseDto.InProgress` (Main board, Host-scherm.dc.html L833/L849) —
 * beurtindicator, fasepillen en beurttimer.
 */
export const board = {
  turnOf: { nl: 'Aan de beurt', en: 'Now playing' },
  timerLabel: { nl: 'Beurttijd', en: 'Turn time' },
  timerPaused: { nl: 'Gepauzeerd', en: 'Paused' },
  phaseReinforce: { nl: 'Versterken', en: 'Reinforce' },
  phaseAttack: { nl: 'Aanvallen', en: 'Attack' },
  phaseFortify: { nl: 'Verplaatsen', en: 'Fortify' },
} satisfies LocaleTree
