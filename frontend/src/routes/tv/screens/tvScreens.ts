import type { ReactNode } from 'react'
import type { GameStateDto } from '../../../types/GameState'
import { GamePhaseDto } from '../../../types/GameState'
import { TvLobbyScreen } from './TvLobbyScreen'
import { TvOrderRollScreen } from './TvOrderRollScreen'
import { TvMainBoardScreen } from './TvMainBoardScreen'
import { TvPlaceholderScreen } from './TvPlaceholderScreen'

/** Wat elk host-scherm van de route meekrijgt; zie `PhoneScreenProps` voor dezelfde opzet. */
export interface TvScreenProps {
  state: GameStateDto
  orderRollThrows: Record<string, number[]>
}

export type TvScreen = (props: TvScreenProps) => ReactNode

/**
 * Fase → basisscherm. Zelfde `Record`-opzet als aan de telefoonkant: een nieuwe fase geeft
 * een compilefout in plaats van stilte.
 */
export const tvScreens: Record<GamePhaseDto, TvScreen> = {
  [GamePhaseDto.Lobby]: TvLobbyScreen,
  [GamePhaseDto.OrderRoll]: TvOrderRollScreen,
  [GamePhaseDto.Claiming]: TvPlaceholderScreen,
  [GamePhaseDto.InitialPlacement]: TvPlaceholderScreen,
  [GamePhaseDto.InProgress]: TvMainBoardScreen,
  [GamePhaseDto.Finished]: TvPlaceholderScreen,
}

/** Versie-skew-vangnet, zie `resolvePhoneScreen` voor waarom dit náást het `Record` bestaat. */
export function resolveTvScreen(phase: GamePhaseDto | undefined): TvScreen {
  return (phase !== undefined && tvScreens[phase]) || TvPlaceholderScreen
}

/**
 * De tweede as van het TV-register. Het design zet gevecht, gebeurtenis, attritie en
 * eliminatie niet als vervangend scherm neer maar als **overlay bóven het lopende bord**
 * (motion.ts C9-C11, plus C12 voor de framing): het bord blijft staan, er komt een laag
 * overheen. Een resolver met alleen een fase-as kan dat niet uitdrukken.
 *
 * Die overlays zijn bouwstap 5/6-werk en bestaan nog niet, dus dit levert voorlopig altijd
 * `null`. Alleen de vorm ligt hiermee vast — een DTO-veld zou hier níét vooruit mogen lopen,
 * maar een interne resolvervorm wel: die achteraf van één naar twee assen verbouwen raakt
 * elk scherm dat er dan aan hangt.
 */
export function resolveTvOverlay(_state: GameStateDto): TvScreen | null {
  return null
}
