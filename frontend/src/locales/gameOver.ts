import type { LocaleTree } from '../i18n/types'

/**
 * Spel-einde (`GamePhaseDto.Finished`, FO §7), telefoonkant — alleen de winnaar-aankondiging.
 * Geen letterlijke DESIGN.md-sectie (het oorspronkelijke design kende geen eindscherm) —
 * structuur en toon naar het voorbeeld van `fortify.ts`'s done-weergave. Missie-onthulling en
 * de "Opnieuw spelen"-stemknop volgen als aparte, latere taak; deze tak bevat dus bewust geen
 * actieknop.
 */
export const gameOver = {
  youWon: { nl: 'Je hebt gewonnen!', en: 'You won!' },
  othersWon_one: { nl: '{{name}} heeft gewonnen.', en: '{{name}} has won.' },
  othersWon_other: { nl: '{{name}} hebben gewonnen.', en: '{{name}} have won.' },
  unknown: { nl: 'Spel afgelopen.', en: 'Game over.' },
} satisfies LocaleTree
