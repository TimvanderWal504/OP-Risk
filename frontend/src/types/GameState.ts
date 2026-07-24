import type { PlayerDto } from './Player'
import type { GameSettingsDto } from './GameSettings'

/**
 * Spiegelt RiskGame.Api.Dtos.GameStateDto en aanverwante types
 * (src/RiskGame.Api/Dtos/GameStateDto.cs) 1-op-1, inclusief enum-volgorde: enums
 * serialiseren als `int` (geen JsonStringEnumConverter geregistreerd in Program.cs).
 */
export const GamePhaseDto = {
  Lobby: 0,
  OrderRoll: 1,
  Claiming: 2,
  InitialPlacement: 3,
  InProgress: 4,
  Finished: 5,
} as const
export type GamePhaseDto = (typeof GamePhaseDto)[keyof typeof GamePhaseDto]

export const TurnPhaseDto = {
  Reinforce: 0,
  Attack: 1,
  Fortify: 2,
} as const
export type TurnPhaseDto = (typeof TurnPhaseDto)[keyof typeof TurnPhaseDto]

/** Spiegelt RiskGame.Api.Dtos.PlayerColorDto — de kleurencatalogus, nooit hardcoden. */
export interface PlayerColorDto {
  id: string
  name: string
  hex: string
  symbol: string
}

/** Spiegelt RiskGame.Api.Dtos.RoleSummaryDto — de rolcatalogus voor de rolkeuzestap. */
export interface RoleSummaryDto {
  id: string
  name: string
  description: string
}

export interface TerritoryDto {
  territoryId: string
  ownerPlayerId: string | null
  armyCount: number
}

export interface PendingCombatDto {
  fromTerritoryId: string
  toTerritoryId: string
  attackDice: number
}

export interface TurnStateDto {
  activePlayerId: string
  turnPhase: TurnPhaseDto
  armiesRemaining: number
  pendingCombat: PendingCombatDto | null
}

export interface GameStateDto {
  gameId: string
  phase: GamePhaseDto
  players: PlayerDto[]
  availableColorIds: string[]
  turnOrder: string[]
  territories: TerritoryDto[]
  turnState: TurnStateDto | null
  colors: PlayerColorDto[]
  roles: RoleSummaryDto[]
  settings: GameSettingsDto
}
