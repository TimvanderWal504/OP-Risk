import type { LocaleTree } from '../i18n/types'

/**
 * Spel-einde (`GamePhaseDto.Finished`, FO §7), TV-kant — winnaar-aankondiging plus de
 * missie-onthulling van alle spelers. Geen letterlijke DESIGN.md-sectie (het oorspronkelijke
 * design kende geen eindscherm) — typografie/badge-tokens geleend van `TvCombatOverlay`'s
 * eliminatie-headline. Missienaam/-omschrijving zelf komen niet hiervandaan — die staan al
 * per missie-id in `locales/missions.ts`, via `tDynamic`.
 */
export const gameOverTv = {
  heading: { nl: 'GEWONNEN', en: 'WON' },
  unknown: { nl: 'Spel afgelopen', en: 'Game over' },
  finalScoreHeading: { nl: 'Eindscore', en: 'Final score' },
  playerColumn: { nl: 'Speler', en: 'Player' },
  missionColumn: { nl: 'Missie', en: 'Mission' },
  statusColumn: { nl: 'Status', en: 'Status' },
  missionCompleted: { nl: 'Voltooid', en: 'Completed' },
  missionNotCompleted: { nl: 'Niet gehaald', en: 'Not achieved' },
} satisfies LocaleTree
