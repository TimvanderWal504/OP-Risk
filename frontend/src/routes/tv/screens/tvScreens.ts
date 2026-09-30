import type { ReactNode } from 'react'
import type { GameStateDto } from '../../../types/GameState'
import { GamePhaseDto } from '../../../types/GameState'
import type { CombatBroadcastState } from '../../../hooks/useCombatBroadcast'
import type { HeldEvent } from '../../../hooks/useHeldEvent'
import type { ShownEvent } from '../../../hooks/useEventOverlayExit'
import type { PendingAttritionDto } from '../../../types/GameState'
import type { StageScrimLevel } from '../../../styles/glass-tokens'
import { TvLobbyScreen } from './TvLobbyScreen'
import { TvOrderRollScreen } from './TvOrderRollScreen'
import { TvClaimingScreen } from './TvClaimingScreen'
import { TvInitialPlacementScreen } from './TvInitialPlacementScreen'
import { TvMainBoardScreen } from './TvMainBoardScreen'
import { TvPlaceholderScreen } from './TvPlaceholderScreen'
import { TvGameOverScreen } from './TvGameOverScreen'
import { TvCombatOverlay } from './TvCombatOverlay'
import { TvEventOverlay } from './TvEventOverlay'

/** Wat elk host-scherm van de route meekrijgt; zie `PhoneScreenProps` voor dezelfde opzet. */
export interface TvScreenProps {
  state: GameStateDto
  orderRollThrows: Record<string, number[]>
  /** Laatst geclaimde gebied (TvClaimingScreen-flare), of `null` als er nog geen event binnen is. */
  lastClaimedTerritoryId: string | null
  /** Combat-broadcastdata, al gehouden door `useHeldCombat` — zie `resolveTvOverlay`. */
  combat: CombatBroadcastState | null
  /** Een net getrokken gebeurteniskaart, al gehouden door `useHeldEvent` (C10). */
  event?: HeldEvent | null
  /**
   * Alleen voor `TvEventOverlay`: de kaart gaat uit (`overlayOut`) en `onExited` ruimt hem op zodra
   * die animatie klaar is — zie `useEventOverlayExit`.
   */
  eventExit?: { shown: ShownEvent; onExited: () => void } | null
}

export type TvScreen = (props: TvScreenProps) => ReactNode

/**
 * Fase → basisscherm. Zelfde `Record`-opzet als aan de telefoonkant: een nieuwe fase geeft
 * een compilefout in plaats van stilte.
 */
export const tvScreens: Record<GamePhaseDto, TvScreen> = {
  [GamePhaseDto.Lobby]: TvLobbyScreen,
  [GamePhaseDto.OrderRoll]: TvOrderRollScreen,
  [GamePhaseDto.Claiming]: TvClaimingScreen,
  [GamePhaseDto.InitialPlacement]: TvInitialPlacementScreen,
  [GamePhaseDto.InProgress]: TvMainBoardScreen,
  [GamePhaseDto.Finished]: TvGameOverScreen,
}

/** Versie-skew-vangnet, zie `resolvePhoneScreen` voor waarom dit náást het `Record` bestaat. */
export function resolveTvScreen(phase: GamePhaseDto | undefined): TvScreen {
  return (phase !== undefined && tvScreens[phase]) || TvPlaceholderScreen
}

/**
 * Fase → scrim-intensiteit van de persistente stage-achtergrond (`TvStageBackground`,
 * tokens in `styles/glass-tokens.ts`). Losse as van `tvScreens` omdat de scrim-laag in
 * `TvShell` zit — buiten het per-fase schermregister — en niet 1-op-1 met een scherm-
 * component hoeft mee te lopen (Claiming/InitialPlacement/InProgress delen bewust
 * hetzelfde "board"-niveau, zie de intensiteitscommentaar in glass-tokens.ts).
 */
export const tvStageScrimLevels: Record<GamePhaseDto, StageScrimLevel> = {
  [GamePhaseDto.Lobby]: 'lobby',
  [GamePhaseDto.OrderRoll]: 'setup',
  [GamePhaseDto.Claiming]: 'board',
  [GamePhaseDto.InitialPlacement]: 'board',
  [GamePhaseDto.InProgress]: 'board',
  [GamePhaseDto.Finished]: 'end',
}

/** Zelfde vangnet-opzet als `resolveTvScreen`: onbekende/ontbrekende fase (verbinden, fout) valt terug op het lobby-niveau. */
export function resolveStageScrimLevel(phase: GamePhaseDto | undefined): StageScrimLevel {
  return (phase !== undefined && tvStageScrimLevels[phase]) || 'lobby'
}

/**
 * De tweede as van het TV-register. Het design zet gevecht, gebeurtenis, attritie en
 * eliminatie niet als vervangend scherm neer maar als **overlay bóven het lopende bord**
 * (motion.ts C9-C11, plus C12 voor de framing): het bord blijft staan, er komt een laag
 * overheen. Een resolver met alleen een fase-as kan dat niet uitdrukken.
 *
 * Combat (C9/C11 — gevecht + eliminatie) en de gebeurteniskaart (C10, DESIGN.md § Event Round).
 * Een gevecht wint altijd van de kaart. De kaart staat er zolang `useHeldEvent` hem vasthoudt, of
 * zolang er "Legers verwijderen"-keuzes lopen (dat laatste is geen houd-periode: het staat er ook
 * na een herladen TV). Beide komen al gehouden binnen: deze resolver kent zelf geen houd-logica.
 */
export function resolveTvOverlay(
  combat: CombatBroadcastState | null,
  event: HeldEvent | null = null,
  pendingAttrition: PendingAttritionDto | null = null,
): TvScreen | null {
  if (combat !== null) return TvCombatOverlay
  if (event !== null || pendingAttrition !== null) return TvEventOverlay

  return null
}

/**
 * Welke kaart de gebeurtenis-overlay toont — dezelfde voorwaarden als `resolveTvOverlay`: niets
 * tijdens een gevecht, anders de kaart van de lopende attrition-keuzes of de vastgehouden trekking.
 */
export function resolveShownEvent(
  combat: CombatBroadcastState | null,
  event: HeldEvent | null,
  pendingAttrition: PendingAttritionDto | null,
): ShownEvent | null {
  if (combat !== null) return null
  const eventId = pendingAttrition?.eventId ?? event?.eventId

  return eventId ? { eventId, draw: event } : null
}
