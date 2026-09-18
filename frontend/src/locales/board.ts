import type { LocaleTree } from '../i18n/types'

/**
 * TV-hoofdbord tijdens `GamePhaseDto.InProgress` (de "Main board"-fase in het oorspronkelijke design) —
 * beurtindicator, fasepillen en beurttimer.
 */
export const board = {
  turnOf: { nl: 'Aan de beurt', en: 'Now playing' },
  timerLabel: { nl: 'Beurttijd', en: 'Turn time' },
  timerPaused: { nl: 'Gepauzeerd', en: 'Paused' },
  phaseReinforce: { nl: 'Versterken', en: 'Reinforce' },
  phaseAttack: { nl: 'Aanvallen', en: 'Attack' },
  phaseFortify: { nl: 'Verplaatsen', en: 'Fortify' },
  playersTitle: { nl: 'Spelers', en: 'Players' },
  territoriesCount: { nl: '{{count}} gebieden', en: '{{count}} territories' },
  armiesLabel: { nl: 'Legers', en: 'Armies' },
  /** FO §7: het aantal kaarten is publiek, de kaarten zelf niet — taak 6. Alleen getoond bij
   *  ≥1 (Invisible Design Rule), geen "0 kaarten"-ruis vroeg in het spel. */
  cardsCount: { nl: '{{count}} kaarten', en: '{{count}} cards' },
} satisfies LocaleTree
