import { TurnPhaseDto } from '../../../types/GameState'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'
import { PhoneReinforceScreen } from './PhoneReinforceScreen'
import { PhoneAttackScreen } from './PhoneAttackScreen'
import type { PhoneScreen } from './phoneScreens'

/**
 * Sub-dispatch binnen `GamePhaseDto.InProgress` op `TurnStateDto.turnPhase` — tweede
 * `Record` naast de fase-as in `phoneScreens.ts`, zelfde motivatie: een gemiste
 * `TurnPhaseDto` geeft een compilefout in plaats van een stille placeholder. Reinforce en
 * Attack hebben een echt scherm; Fortify volgt in een latere taak.
 *
 * Losstaand van `PhoneInProgressScreen.tsx` (i.p.v. co-located) zodat dat bestand alleen
 * de component exporteert — een bestand dat naast een component ook losse constanten
 * exporteert breekt Fast Refresh (react-refresh/only-export-components).
 */
const turnPhaseScreens: Record<TurnPhaseDto, PhoneScreen> = {
  [TurnPhaseDto.Reinforce]: PhoneReinforceScreen,
  [TurnPhaseDto.Attack]: PhoneAttackScreen,
  [TurnPhaseDto.Fortify]: PhonePlaceholderScreen,
}

/**
 * Runtime-vangnet naast de compile-time garantie hierboven — dekt versie-skew
 * (`resolvePhoneScreen` in `phoneScreens.ts` is het analoge vangnet op de fase-as) en een
 * (nog) ontbrekende `turnState` (bv. het venster vóór de eerste `GameStateUpdated` na
 * fase-intrede).
 */
export function resolvePhoneTurnPhaseScreen(turnPhase: TurnPhaseDto | undefined): PhoneScreen {
  return (turnPhase !== undefined && turnPhaseScreens[turnPhase]) || PhonePlaceholderScreen
}
