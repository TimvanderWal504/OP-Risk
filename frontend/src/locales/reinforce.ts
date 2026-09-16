import type { LocaleTree } from '../i18n/types'

/**
 * Versterken (`TurnPhaseDto.Reinforce`, FO §5.2), telefoonkant. Bron:
 * het oorspronkelijke telefoon-design se `isReinf`-fase.
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
  placeAllFirst: { nl: 'Verdeel eerst alle {{count}} legers', en: 'Place all {{count}} armies first' },
  /**
   * Niet in de export: die kent maar twee knopstaten (verdelen/klaar), want de demo plaatst
   * lokaal zonder server-round-trip. Onze server-round-trip (stage-then-confirm, zie het
   * Reinforce-plan) heeft een tussenstaat nodig — alles lokaal verdeeld, nog niet verstuurd —
   * anders zou de fase al eindigen vóórdat de server het weet. Zodra de server `armiesLeft`
   * op 0 zet is er niets meer te kiezen: de fase eindigt dan automatisch (geen "klaar"-knop
   * meer, zie `PlaceReinforcementStep.tsx`).
   */
  confirmLabel: { nl: 'Bevestigen', en: 'Confirm' },
} satisfies LocaleTree
