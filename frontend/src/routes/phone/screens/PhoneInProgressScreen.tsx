import { createElement } from 'react'
import { resolvePhoneTurnPhaseScreen } from './phoneTurnPhaseScreens'
import { PhoneAttritionScreen } from './PhoneAttritionScreen'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Dispatcht binnen `GamePhaseDto.InProgress` verder op `TurnStateDto.turnPhase`, via
 * `resolvePhoneTurnPhaseScreen` (`phoneTurnPhaseScreens.ts`). `createElement` i.p.v. een
 * JSX-tag op een berekende componentvariabele: dat laatste wordt door React elke render als
 * een nieuw gedefinieerd component gezien (state-reset per render) — zelfde patroon als
 * `PhonePage.tsx` op de fase-as hierboven.
 *
 * Lopende "Legers verwijderen"-keuzes (FO §9.2) gaan vóór: dan loopt er geen beurt.
 */
export function PhoneInProgressScreen(props: PhoneScreenProps) {
  if (props.state.pendingAttrition) return createElement(PhoneAttritionScreen, props)

  return createElement(resolvePhoneTurnPhaseScreen(props.state.turnState?.turnPhase), props)
}
