import { GamePhaseDto, TurnPhaseDto } from '../../../types/GameState'
import type { GamePhaseDto as GamePhaseDtoType, TurnPhaseDto as TurnPhaseDtoType } from '../../../types/GameState'

/**
 * Identificeert welke korte, generieke fasenaam `PlayerHeader.status` moet tonen — niet de
 * rijkere titel die elk scherm zelf al toont ("Verdeel je legers · 6 te verdelen"). De
 * aanroeper (`PhonePlayerHeader.tsx`) vertaalt dit naar een letterlijke, statisch getypeerde
 * `t('ns:key')`-aanroep; bestaande sleutels die precies hiervoor al bedoeld waren (zie de
 * doc-comment op `setup:idle.placingArmies`: "een fasenaam, net als attack:bystander.subtitle
 * en reinforce:kicker") i.p.v. een nieuwe, tweede bron van dezelfde tekst.
 */
export type PhoneHeaderStatusId = 'claiming' | 'placingArmies' | 'reinforce' | 'attack' | 'fortify'

/**
 * `null` betekent: geen header op dit moment — `PhonePage.tsx` mount `PlayerHeader` sowieso
 * niet buiten Claiming/InitialPlacement/InProgress (Lobby/OrderRoll/Finished, zie daar), en
 * binnen InProgress ontbreekt een fasenaam alleen zolang `turnState` nog niet gevuld is.
 */
export function resolvePhoneHeaderStatus(
  phase: GamePhaseDtoType,
  turnPhase: TurnPhaseDtoType | null,
): PhoneHeaderStatusId | null {
  switch (phase) {
    case GamePhaseDto.Claiming:
      return 'claiming'
    case GamePhaseDto.InitialPlacement:
      return 'placingArmies'
    case GamePhaseDto.InProgress:
      switch (turnPhase) {
        case TurnPhaseDto.Reinforce:
          return 'reinforce'
        case TurnPhaseDto.Attack:
          return 'attack'
        case TurnPhaseDto.Fortify:
          return 'fortify'
        default:
          return null
      }
    default:
      return null
  }
}
