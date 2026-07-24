/**
 * Spiegelt RiskGame.Api.Dtos.GameSettingsDto en de bijbehorende enums
 * (src/RiskGame.Api/Dtos/GameSettingsDto.cs) 1-op-1, inclusief enum-volgorde: enums
 * serialiseren als `int` (geen JsonStringEnumConverter geregistreerd in Program.cs).
 */
export const WinConditionDto = {
  WorldDomination: 0,
  SecretMissions: 1,
} as const
export type WinConditionDto = (typeof WinConditionDto)[keyof typeof WinConditionDto]

export const SetupModeDto = {
  Random: 0,
  Claiming: 1,
} as const
export type SetupModeDto = (typeof SetupModeDto)[keyof typeof SetupModeDto]

export const RoleAssignmentModeDto = {
  Random: 0,
  Choose: 1,
} as const
export type RoleAssignmentModeDto = (typeof RoleAssignmentModeDto)[keyof typeof RoleAssignmentModeDto]

export interface GameSettingsDto {
  winCondition: WinConditionDto
  setupMode: SetupModeDto
  startingArmies: number
  turnTimerSeconds: number
  fortifyTimerSeconds: number
  rolesEnabled: boolean
  roleAssignment: RoleAssignmentModeDto
  eventsEnabled: boolean
}

/** Spiegelt RiskGame.Api.Dtos.CreateGameDtos (src/RiskGame.Api/Dtos/CreateGameDtos.cs). */
export interface CreateGameRequest {
  mapId: string
  settings: GameSettingsDto
}

export interface CreateGameResponse {
  gameId: string
}
