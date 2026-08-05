import type { LocaleTree } from '../i18n/types'

/**
 * Combat-/eliminatie-overlay op de TV (`showCombatOv`-fase in het oorspronkelijke design;
 * `showElimOv`). `t.elimKicker` (L465) heeft geen waarde in de export se eigen NL/EN-
 * vertaaltabellen (L834/L850) — ontbrekende bron, niet zelf ingevuld; de kicker-regel is
 * daarom weggelaten, `elimHeadline` alleen blijft staan (die heeft wél een bronwaarde, L1114).
 * Reroll-chip (L334-338, Generaal-rol) en het rechterspelerpaneel/feed-strip (C12) ontbreken
 * bewust — buiten scope, zie het Attack-bouwplan.
 */
export const attackTv = {
  kicker: { nl: 'Gevecht', en: 'Combat' },
  vs: { nl: 'vs', en: 'vs' },
  attackerLabel: { nl: 'Aanvaller', en: 'Attacker' },
  defenderLabel: { nl: 'Verdediger', en: 'Defender' },
  captured: { nl: 'VEROVERD', en: 'CAPTURED' },
  resultLine: {
    nl: 'Verdediger verliest {{defenderLosses}} legers · Aanvaller verliest {{attackerLosses}}',
    en: 'Defender loses {{defenderLosses}} armies · Attacker loses {{attackerLosses}}',
  },
  moveIn: {
    nl: 'Aanvaller verplaatst {{armies}} legers naar {{territory}}',
    en: 'Attacker moves {{armies}} armies into {{territory}}',
  },
  eliminatedHeadline: { nl: '{{name}} UITGESCHAKELD', en: '{{name}} ELIMINATED' },
  eliminatedBy: { nl: 'Verslagen door {{name}}', en: 'Defeated by {{name}}' },
} satisfies LocaleTree
