import { vi } from 'vitest'
import { GamePhaseDto, type GameStateDto, type SetupStateDto } from '../../../types/GameState'
import { RoleAssignmentModeDto, SetupModeDto, WinConditionDto } from '../../../types/GameSettings'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Basis-state en -props voor de schermtests. Elke test overschrijft alleen wat hij nodig
 * heeft, zodat in de test zelf te zien is welk gegeven het gedrag stuurt.
 */
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

/** De door de server afgeleide setup-state; tests zetten alleen wat hun gedrag stuurt. */
export const fixtureSetupState = (overrides: Partial<SetupStateDto> = {}): SetupStateDto => ({
  activePlayerId: 'alice',
  remainingArmiesByPlayer: { alice: 0, bob: 0 },
  claimableTerritoryIdsByPlayer: { alice: [], bob: [] },
  ...overrides,
})

export const fixtureProps = (overrides: Partial<PhoneScreenProps> = {}): PhoneScreenProps => ({
  state: fixtureState,
  playerId: 'alice',
  me: fixtureState.players[0],
  error: null,
  orderRollThrows: {},
  territoryCatalog: [],
  chooseColor: vi.fn(),
  selectRole: vi.fn(),
  startGame: vi.fn(),
  removePlayer: vi.fn(),
  rollForOrder: vi.fn(),
  claimTerritory: vi.fn(),
  placeInitialArmy: vi.fn(),
  placeReinforcements: vi.fn(),
  endPhase: vi.fn(),
  combat: null,
  declareAttack: vi.fn(),
  chooseDefenseDice: vi.fn(),
  moveAfterConquest: vi.fn(),
  abandonAttack: vi.fn(),
  fortify: vi.fn(),
  endTurn: vi.fn(),
  ...overrides,
})
