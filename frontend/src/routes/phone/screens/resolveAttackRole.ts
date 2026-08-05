import type { GameStateDto } from '../../../types/GameState'

export type AttackRole = 'conquest-move' | 'attacker' | 'defending' | 'bystander'

/**
 * Vastgelegde rol-discriminator voor de Attack-fase (zie het bouwplan, "Rolmodel"): puur
 * state-gedreven zolang er een `pendingCombat` loopt (eigendomswissel van `toTerritoryId` zit
 * altijd al in dezelfde `GameStateDto`-snapshot als de eigendomsovergang zelf — nooit
 * afhankelijk van of `CombatNarrated` al is aangekomen). `combat` is hier bewust geen input:
 * die drijft alleen de weergave ín de stappen (eigen worp, defensieresultaat), niet welke stap
 * getoond wordt.
 *
 * Losstaand van `PhoneAttackScreen.tsx` (i.p.v. co-located) zodat dat bestand alleen de
 * component exporteert — een bestand dat naast een component ook een losse functie
 * exporteert breekt Fast Refresh (react-refresh/only-export-components).
 */
export function resolveAttackRole(state: GameStateDto, playerId: string): AttackRole {
  const turnState = state.turnState

  if (!turnState) return 'bystander'

  const isActive = turnState.activePlayerId === playerId
  const pendingCombat = turnState.pendingCombat

  if (pendingCombat !== null) {
    const toOwner = state.territories.find((t) => t.territoryId === pendingCombat.toTerritoryId)?.ownerPlayerId ?? null

    if (isActive && toOwner === playerId) return 'conquest-move'
    if (isActive && toOwner !== playerId) return 'attacker'
    if (!isActive && toOwner === playerId) return 'defending'

    return 'bystander'
  }

  return isActive ? 'attacker' : 'bystander'
}
