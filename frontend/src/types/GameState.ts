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
  onHex: string
  symbol: string
}

/** Spiegelt RiskGame.Api.Dtos.RoleSummaryDto — de rolcatalogus voor de rolkeuzestap. */
export interface RoleSummaryDto {
  id: string
  name: string
  description: string
  /** Herkomstland (territoryId); gelokaliseerd via `tDynamic(originTerritory, 'territories')`. */
  originTerritory: string
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
  /** De actuele aanvalsworp — na een herwerp de nieuwe, gesorteerde worp (plan-rollen C5). */
  attackerRolls: number[]
  /** Of de aanvaller nog "Herwerp"/"Doorgaan" moet kiezen vóór de verdediger mag reageren
   *  (FO §5.3 stap 3, §8.1) — de telefoon mag dit niet zelf uit een actieve rol afleiden
   *  (frontend/CLAUDE.md), dus dit komt rechtstreeks van de server. */
  awaitingRerollDecision: boolean
}

/**
 * Spiegelt RiskGame.Api.Dtos.TurnTimerDto — bewust relatief (`remainingMs`), geen absolute
 * deadline: zo vergelijkt de client zijn eigen klok nooit met die van de server (klokdrift
 * tussen TV en telefoon bestaat dan niet als categorie). Al geklemd op 0 door de mapper.
 */
export interface TurnTimerDto {
  remainingMs: number
  isPaused: boolean
}

/** Spiegelt RiskGame.Api.Dtos.ReinforcementBreakdownDto — alleen gevuld tijdens Reinforce. */
export interface ReinforcementBreakdownDto {
  baseArmies: number
  continentBonus: number
  roleBonus: number
  eventBonus: number
  /** Som van de inlegwaarde over nog niet volledig geplaatste inlegs van déze fase — 0 zolang
   *  er niets ingelegd is. Niet zelf uitrekenen: de client kent de eigen hand wel, maar niet
   *  welke inleg(s) nog "los" staan (server-only, FO §5.4). */
  cardTradeBonus: number
}

export interface TurnStateDto {
  activePlayerId: string
  turnPhase: TurnPhaseDto
  armiesRemaining: number
  pendingCombat: PendingCombatDto | null
  timer: TurnTimerDto | null
  reinforcementBreakdown: ReinforcementBreakdownDto | null
  /**
   * Hoeveel keer de actieve speler deze fase nog mag Fortify'en (normaal 1, met een actieve
   * FortifyUpgrade/moves-rolboost meer — FO §8.1/§5.2 Kernregel). Al verrekend door de server;
   * 0 betekent klaar deze fase — de telefoon mag deze spelregel niet zelf nabouwen
   * (frontend/CLAUDE.md).
   */
  fortifiesRemaining: number
  /**
   * Of de actieve speler moet inleggen vóór elke andere actie — een andere drempel per fase
   * (Reinforce: 5+ kaarten, FO §5.2; Attack: 6+ ná een eliminatie, FO §7), `false` in Fortify.
   * De telefoon mag deze spelregel niet zelf nabouwen (frontend/CLAUDE.md), dus dit komt
   * rechtstreeks van de server.
   */
  mustTradeInCards: boolean
  /**
   * Alleen gevuld tijdens `TurnPhaseDto.Fortify` (leeg daarbuiten): de eigen gebieden van de
   * actieve speler, verdeeld in samenhangende groepen (`FortifyGuards.ReachableComponents`).
   * Bereikbaarheid is symmetrisch, dus "bereikbaar vanuit gebied X" is de rest van X's groep.
   */
  reachableFortifyGroups: string[][]
}

/** Spiegelt RiskGame.Api.Dtos.OrderRollStateDto — wie er nog mag gooien voor de volgorde. */
export interface OrderRollStateDto {
  playersStillToRoll: string[]
}

/**
 * Spiegelt RiskGame.Api.Dtos.SetupStateDto — alles wat de startopstelling nodig heeft, door
 * de server afgeleid (turnState is in deze fases nog null).
 *
 * `activePlayerId` is `null` tijdens InitialPlacement bij SetupMode.Random: daar plaatst
 * iedereen gelijktijdig, er is geen actieve speler. Dat onderscheid is hiermee volledig af te
 * lezen — brancht dus niet op `settings.setupMode`, dat is alleen weergave.
 */
export interface SetupStateDto {
  activePlayerId: string | null
  /** Hoeveel startlegers elke speler nog moet plaatsen; niet zelf uitrekenen. */
  remainingArmiesByPlayer: Record<string, number>
  /** Welke gebieden elke speler mag claimen (vrij, en niet zijn eigen rol-herkomstland). */
  claimableTerritoryIdsByPlayer: Record<string, string[]>
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
  orderRollState: OrderRollStateDto | null,
  setupState: SetupStateDto | null,
  stateVersion: number
  /** Wie het spel gewonnen heeft; leeg totdat `phase === GamePhaseDto.Finished`. */
  winners: string[]
  /**
   * FO §6.2: alleen gevuld tijdens een lopend laatste-kans-venster ÉN alleen wanneer
   * `settings.missionWinTiming === MissionWinTimingDto.FullRoundRevealed` — anders altijd
   * `null`, ook als er intern wel een venster loopt (optie "Volgende beurt" onthult bewust
   * niets). Bevat uitsluitend de speler-id, nooit de missie-inhoud: die blijft geheim tot
   * `phase === GamePhaseDto.Finished`.
   */
  pendingWinnerPlayerId: string | null
}
