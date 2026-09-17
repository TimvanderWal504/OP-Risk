import type { LocaleTree } from '../i18n/types'

/**
 * Versterken (`TurnPhaseDto.Reinforce`, FO §5.2), telefoonkant. Bron:
 * het oorspronkelijke telefoon-design se `isReinf`-fase.
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
  /** Alleen zichtbaar bij `reinforcementBreakdown.cardTradeBonus > 0` (taak 4b: som van nog
   *  niet volledig geplaatste inlegs van déze fase, PlaceReinforcementStep.tsx). */
  cardTradeBonusRow: { nl: 'Kaarteninleg', en: 'Card trade-in' },
  placeAllFirst: { nl: 'Verdeel eerst alle {{count}} legers', en: 'Place all {{count}} armies first' },
  tradeCardsButton: { nl: 'Leg kaarten in', en: 'Trade in cards' },
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
