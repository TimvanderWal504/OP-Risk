import { GamePhaseDto, type GameStateDto } from '../../../types/GameState'
import { RoleAssignmentModeDto, SetupModeDto, WinConditionDto } from '../../../types/GameSettings'

/** Basis-state voor de host-schermtests; elke test overschrijft wat zijn gedrag stuurt. */
export const fixtureState: GameStateDto = {
  gameId: 'ABCD',
  phase: GamePhaseDto.Lobby,
  players: [
    { id: 'alice', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false },
    { id: 'bob', name: 'Bob', colorId: 'blue', roleId: null, isHost: false, isEliminated: false },
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
  },
  orderRollState: null,
  setupState: null,
  stateVersion: 1,
}
