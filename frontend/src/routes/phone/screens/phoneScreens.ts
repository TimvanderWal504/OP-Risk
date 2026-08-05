import type { ReactNode } from 'react'
import type { GameStateDto } from '../../../types/GameState'
import { GamePhaseDto } from '../../../types/GameState'
import type { PlayerDto } from '../../../types/Player'
import type { TerritoryCatalogDto } from '../../../types/TerritoryCatalog'
import type { CombatBroadcastState } from '../../../hooks/useCombatBroadcast'
import type { CombatResultResponse } from '../../../types/HubResponses'
import { PhoneClaimingScreen } from './PhoneClaimingScreen'
import { PhoneInitialPlacementScreen } from './PhoneInitialPlacementScreen'
import { PhoneInProgressScreen } from './PhoneInProgressScreen'
import { PhoneLobbyScreen } from './PhoneLobbyScreen'
import { PhoneOrderRollScreen } from './PhoneOrderRollScreen'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'

/**
 * Wat elk telefoon-scherm van de route meekrijgt. Eén gedeeld contract, zodat de fase →
 * scherm-koppeling een simpele lookup blijft; elk scherm pakt eruit wat het nodig heeft.
 * De schermen leiden hier props uit af en kiezen hun substaat — data ophalen doen ze niet,
 * dat blijft `useGameState` (frontend/CLAUDE.md, presentational vs. container).
 */
export interface PhoneScreenProps {
  state: GameStateDto
  playerId: string
  /** De eigen speler; door de route al opgezocht, dus nooit null in een scherm. */
  me: PlayerDto
  error: string | null
  orderRollThrows: Record<string, number[]>
  territoryCatalog: TerritoryCatalogDto[]
  chooseColor: (colorId: string) => Promise<void>
  selectRole: (roleId: string) => Promise<void>
  startGame: () => Promise<void>
  removePlayer: (targetPlayerId: string) => Promise<void>
  rollForOrder: () => Promise<void>
  claimTerritory: (territoryId: string) => Promise<void>
  placeInitialArmy: (territoryId: string) => Promise<void>
  placeReinforcements: (territoryId: string, amount: number) => Promise<void>
  endPhase: () => Promise<void>
  /** Narratieve gevechts-broadcastdata (attacker/defender-worpen + resultaat), zie
   *  `useCombatBroadcast.ts`. Alleen relevant tijdens `TurnPhaseDto.Attack`. */
  combat: CombatBroadcastState | null
  declareAttack: (fromTerritoryId: string, toTerritoryId: string, attackDice: number) => Promise<void>
  /** Géén fire-and-forget: `DefendStep` toont het resultaat rechtstreeks uit deze respons. */
  chooseDefenseDice: (defenseDice: number) => Promise<CombatResultResponse | undefined>
  moveAfterConquest: (armiesToMove: number) => Promise<void>
  /** "Ander gevecht" (FO §5.4): stopt de huidige belegering handmatig, hervat de beurttimer. */
  abandonAttack: () => Promise<void>
}

export type PhoneScreen = (props: PhoneScreenProps) => ReactNode

/**
 * Fase → scherm. Bewust een `Record` over de volledige `GamePhaseDto` en geen if-cascade:
 * komt er een fase bij, dan is dit een compilefout in plaats van een scherm dat stilzwijgend
 * in de placeholder valt.
 */
export const phoneScreens: Record<GamePhaseDto, PhoneScreen> = {
  [GamePhaseDto.Lobby]: PhoneLobbyScreen,
  [GamePhaseDto.OrderRoll]: PhoneOrderRollScreen,
  [GamePhaseDto.Claiming]: PhoneClaimingScreen,
  [GamePhaseDto.InitialPlacement]: PhoneInitialPlacementScreen,
  [GamePhaseDto.InProgress]: PhoneInProgressScreen,
  [GamePhaseDto.Finished]: PhonePlaceholderScreen,
}

/**
 * De runtime-tegenhanger van de compile-time garantie hierboven, en niet hetzelfde vangnet:
 * dit dekt **versie-skew**, niet een onvolledig register. Telefoon en TV zijn losse clients
 * tegen dezelfde server, dus een toestel kan een oudere bundel draaien (cache, tab die al een
 * uur openstaat) terwijl de server al een fase stuurt die die bundel niet kent. Zonder deze
 * fallback is dat een `undefined` component en dus een wit scherm midden in een pot.
 * Niet weghalen omdat "het register toch compleet is" — dat is precies het andere vangnet.
 */
export function resolvePhoneScreen(phase: GamePhaseDto | undefined): PhoneScreen {
  return (phase !== undefined && phoneScreens[phase]) || PhonePlaceholderScreen
}
