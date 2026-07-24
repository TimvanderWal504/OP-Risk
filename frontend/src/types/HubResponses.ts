import type { GameStateDto } from './GameState'

/** Spiegelt RiskGame.Api.Hubs.JoinGameResponse (src/RiskGame.Api/Hubs/GameHub.cs). */
export interface JoinGameResponse {
  playerId: string
  state: GameStateDto
}
