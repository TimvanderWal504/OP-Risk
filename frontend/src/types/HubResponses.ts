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
 */
export interface DiceRolledMessage {
  playerId: string
  dice: number[]
  context: 'order-roll' | 'attack' | 'defense'
}
