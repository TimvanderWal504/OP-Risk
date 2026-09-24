import { GamePhaseDto, type GameStateDto } from '../../../types/GameState'
import {
  DefenseDiceRuleDto,
  MissionWinTimingDto,
  RoleAssignmentModeDto,
  SetupModeDto,
  WinConditionDto,
} from '../../../types/GameSettings'
import { TvLanguageDto } from '../../../types/TvDisplay'

/** Basis-state voor de host-schermtests; elke test overschrijft wat zijn gedrag stuurt. */
export const fixtureState: GameStateDto = {
  gameId: 'ABCD',
  phase: GamePhaseDto.Lobby,
  players: [
    { id: 'alice', name: 'Alice', colorId: 'red', roleId: null, isRoleActive: false, defenseBoostAvailable: false, isHost: true, isEliminated: false, hand: [], hasTradeableCardSet: false, handCount: 0, missionId: null },
    { id: 'bob', name: 'Bob', colorId: 'blue', roleId: null, isRoleActive: false, defenseBoostAvailable: false, isHost: false, isEliminated: false, hand: [], hasTradeableCardSet: false, handCount: 0, missionId: null },
  ],
  availableColorIds: ['green'],
  turnOrder: ['alice', 'bob'],
  territories: [],
  turnState: null,
  colors: [
    { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#ffffff', symbol: 'circle' },
    { id: 'blue', name: 'Blauw', hex: '#2980b9', onHex: '#ffffff', symbol: 'square' },
    { id: 'green', name: 'Groen', hex: '#27ae60', onHex: '#ffffff', symbol: 'triangle' },
  ],
  roles: [],
  settings: {
    winCondition: WinConditionDto.WorldDomination,
    setupMode: SetupModeDto.Claiming,
    startingArmiesPresetId: 'classic',
    turnTimerSeconds: 180,
    fortifyTimerSeconds: 60,
    rolesEnabled: false,
    roleAssignment: RoleAssignmentModeDto.Random,
    eventsEnabled: false,
    missionWinTiming: MissionWinTimingDto.EndOfTurn,
    defenseDiceRule: DefenseDiceRuleDto.HouseRule,
  },
  orderRollState: null,
  setupState: null,
  stateVersion: 1,
  winners: [],
  pendingWinnerPlayerId: null,
  tvDisplay: { textScale: 50, glassOpacity: 50, glassBlur: 50, language: TvLanguageDto.Nl, diceScale: 50 },
  tvDisplayDefault: { textScale: 50, glassOpacity: 50, glassBlur: 50, language: TvLanguageDto.Nl, diceScale: 50 },
  continents: [],
  events: [],
  nextCardTradeValue: 4,
  startingArmies: null,
}
