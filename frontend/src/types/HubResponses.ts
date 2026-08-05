import type { GameStateDto } from './GameState'

/** Spiegelt RiskGame.Api.Hubs.JoinGameResponse (src/RiskGame.Api/Hubs/GameHub.cs). */
export interface JoinGameResponse {
  playerId: string
  state: GameStateDto
}

/** Spiegelt RiskGame.Api.Hubs.OrderRollResponse (src/RiskGame.Api/Hubs/GameHub.cs). */
export interface OrderRollResponse {
  die1: number
  die2: number
  state: GameStateDto
}

/**
 * Spiegelt RiskGame.Api.Hubs.DiceRolledMessage — transiënt "DiceRolled"-broadcast-event
 * (geen state, puur audit/weergave) voor order-roll- en gevechtsworpen.
 * `correlationId` is `null` bij `order-roll` (geen gevecht om aan te correleren) en gelijk
 * aan `PendingCombat.CorrelationId` bij `attack`/`defense` — zie `useCombatBroadcast.ts`.
 */
export interface DiceRolledMessage {
  playerId: string
  dice: number[]
  context: 'order-roll' | 'attack' | 'defense'
  correlationId: string | null
}

/**
 * Spiegelt RiskGame.Api.Hubs.CombatNarratedMessage — transiënt "CombatNarrated"-broadcast
 * (geen state) met de uitkomst van een opgelost gevecht (FO §5.3): wie viel wie aan, vanuit/
 * naar welk gebied, verliezen, verovering en eventuele eliminatie. `stateVersion` koppelt dit
 * event aan de bijbehorende `GameStateDto.stateVersion` (zelfde soort verdediging als
 * `applyState` al toepast op het state-kanaal), `correlationId` koppelt het aan de
 * `DiceRolledMessage`-events van hetzelfde gevecht.
 */
export interface CombatNarratedMessage {
  correlationId: string
  attackerId: string
  defenderId: string
  fromTerritoryId: string
  toTerritoryId: string
  attackerLosses: number
  defenderLosses: number
  conquered: boolean
  eliminatedPlayerId: string | null
  stateVersion: number
}

/** Spiegelt RiskGame.Api.Hubs.DeclareAttackResponse (src/RiskGame.Api/Hubs/GameHub.cs). */
export interface DeclareAttackResponse {
  attackerRolls: number[]
  state: GameStateDto
}

/**
 * Spiegelt RiskGame.Api.Hubs.CombatResultResponse — de directe invoke-respons op
 * `ChooseDefenseDice`, met het volledige gevechtsresultaat. De verdediger heeft hier nooit een
 * broadcast voor nodig (zie het Attack-bouwplan): dit is genoeg om `DefendStep` te tonen.
 */
export interface CombatResultResponse {
  attackerRolls: number[]
  defenderRolls: number[]
  attackerLosses: number
  defenderLosses: number
  conquered: boolean
  state: GameStateDto
}

/**
 * Spiegelt RiskGame.Api.Hubs.TerritoryClaimedMessage — transiënt "TerritoryClaimed"-broadcast
 * (geen state) voor de TV-flare op het laatst geclaimde gebied tijdens `GamePhaseDto.Claiming`.
 */
export interface TerritoryClaimedMessage {
  territoryId: string
  playerId: string
  stateVersion: number
}
