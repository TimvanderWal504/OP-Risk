import type { TvDisplaySettingsDto } from './TvDisplay'

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

/**
 * Wanneer een vervulde bezit-missie daadwerkelijk wint (FO §6.2). Alleen relevant bij
 * `WinConditionDto.SecretMissions` — bij WorldDomination is de waarde betekenisloos.
 */
export const MissionWinTimingDto = {
  EndOfTurn: 0,
  StartOfNextTurn: 1,
  FullRoundRevealed: 2,
} as const
export type MissionWinTimingDto = (typeof MissionWinTimingDto)[keyof typeof MissionWinTimingDto]

/**
 * Wat de verdediger mag kiezen (FO §5.3 stap 4, §10). Alleen voor weergave en om de
 * boost-keuze te tonen; de server dwingt de regel af (`AttackGuards.CanChooseDefenseDice`).
 */
export const DefenseDiceRuleDto = {
  HouseRule: 0,
  Classic: 1,
} as const
export type DefenseDiceRuleDto = (typeof DefenseDiceRuleDto)[keyof typeof DefenseDiceRuleDto]

export interface GameSettingsDto {
  winCondition: WinConditionDto
  /**
   * Alleen voor weergave ("Modus: Willekeurig" in het instellingenoverzicht). Nooit om gedrag
   * op te branchen: wat de modus betekent voor beurten en keuzes leidt de server af en levert
   * hij in `SetupStateDto`. Wie hier toch op brancht, bouwt een spelregel terug in de client.
   */
  setupMode: SetupModeDto
  startingArmiesPresetId: string
  turnTimerSeconds: number
  fortifyTimerSeconds: number
  rolesEnabled: boolean
  roleAssignment: RoleAssignmentModeDto
  eventsEnabled: boolean
  missionWinTiming: MissionWinTimingDto
  defenseDiceRule: DefenseDiceRuleDto
}

/** Spiegelt RiskGame.Api.Dtos.StartingArmiesPresetDto (src/RiskGame.Api/Dtos/GameSettingsDto.cs). */
export interface StartingArmiesPresetDto {
  id: string
  armiesByPlayerCount: Record<number, number>
}

/** Spiegelt RiskGame.Api.Dtos.CreateGameDtos (src/RiskGame.Api/Dtos/CreateGameDtos.cs). */
export interface CreateGameRequest {
  mapId: string
  settings: GameSettingsDto
  /** Onthouden TV-weergave van een vorig spel (plan-testronde-tv punt 2); `null` = het design. */
  tvDisplay: TvDisplaySettingsDto | null
}

export interface CreateGameResponse {
  gameId: string
}
