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
  // Verhalend, altijd vanuit de aanvaller (2026-08-13, op verzoek): de TV heeft geen "jij" — meerdere
  // spelers kijken mee — dus staan hier kleurnamen i.p.v. spelersrollen, en begint elke zin met de
  // aanvallende kleur, ook bij een gemengde uitkomst. Zelfde `_one`/`_other`-mechanisme als
  // `attack.resultLine` (telefoonkant); `both` is vast op 1-om-1, zie de toelichting daar.
  resultLine: {
    won_one: { nl: '{{attacker}} verslaat {{count}} leger', en: '{{attacker}} defeats {{count}} army' },
    won_other: { nl: '{{attacker}} verslaat {{count}} legers', en: '{{attacker}} defeats {{count}} armies' },
    lost_one: { nl: '{{attacker}} verliest {{count}} leger', en: '{{attacker}} loses {{count}} army' },
    lost_other: { nl: '{{attacker}} verliest {{count}} legers', en: '{{attacker}} loses {{count}} armies' },
    both: { nl: '{{attacker}} en {{defender}} verliezen beide 1 leger', en: '{{attacker}} and {{defender}} both lose 1 army' },
  },
  moveIn: {
    nl: 'Aanvaller verplaatst {{armies}} legers naar {{territory}}',
    en: 'Attacker moves {{armies}} armies into {{territory}}',
  },
  eliminatedHeadline: { nl: '{{name}} UITGESCHAKELD', en: '{{name}} ELIMINATED' },
  eliminatedBy: { nl: 'Verslagen door {{name}}', en: 'Defeated by {{name}}' },
} satisfies LocaleTree
