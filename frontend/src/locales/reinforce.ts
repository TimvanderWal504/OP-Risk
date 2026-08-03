import type { LocaleTree } from '../i18n/types'

/**
 * Versterken (`TurnPhaseDto.Reinforce`, FO §5.2), telefoonkant. Bron:
 * `design-reference/phone/Operatie Atlas Telefoon.dc.html` L501-540 (`isReinf`).
 * De "Kaarteninleg"-rij uit de export (L519-526) ontbreekt bewust — blokkeert op het
 * ontbrekende hand-DTO (zie het Reinforce-plan, "Buiten scope"), niet vergeten.
 */
export const reinforce = {
  kicker: { nl: 'Versterken', en: 'Reinforce' },
  distribute: { nl: 'Verdeel je legers', en: 'Distribute your armies' },
  toPlace: { nl: 'te verdelen', en: 'to place' },
  buildup: { nl: 'Opbouw', en: 'Build-up' },
  territoriesRow: { nl: 'Gebieden ({{count}} ÷ 3)', en: 'Territories ({{count}} ÷ 3)' },
  continentBonusRow: { nl: 'Continentbonus', en: 'Continent bonus' },
  roleBonusRow: { nl: 'Roleffect', en: 'Role effect' },
  eventBonusRow: { nl: 'Gebeurteniseffect', en: 'Event effect' },
  doneLabel: { nl: 'Klaar → Aanvallen', en: 'Done → Attack' },
  placeAllFirst: { nl: 'Verdeel eerst alle {{count}} legers', en: 'Place all {{count}} armies first' },
  /**
   * Niet in de export: die kent maar twee knopstaten (verdelen/klaar), want de demo plaatst
   * lokaal zonder server-round-trip. Onze server-round-trip (stage-then-confirm, zie het
   * Reinforce-plan) heeft een derde tussenstaat nodig — alles lokaal verdeeld, nog niet
   * verstuurd — anders zou de knop "Klaar → Aanvallen" tonen vóórdat de server het weet.
   */
  confirmLabel: { nl: 'Bevestigen', en: 'Confirm' },
} satisfies LocaleTree
