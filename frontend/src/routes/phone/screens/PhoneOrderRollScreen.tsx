import { OrderRollWaitStep } from '../../../components/OrderRollWaitStep'
import { TvDisplayAccess } from '../../../components/TvDisplayAccess'
import { SkipTvHoldButton } from '../../../components/SkipTvHoldButton'
import { GamePhaseDto } from '../../../types/GameState'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Volgorde bepalen (FO §2.1): de eigen worp, met de eigen kleur als accent. De host kan hier ook
 * de TV-weergave bijstellen (plan-testronde-tv punt 2) — deze fase heeft geen `PhonePlayerHeader` —
 * en, zolang de uitslag nog vastgehouden wordt, "Verder op TV" kiezen (FO §2.2).
 */
export function PhoneOrderRollScreen({
  state,
  playerId,
  me,
  orderRollThrows,
  rollForOrder,
  setTvDisplay,
  skipTvHold,
}: PhoneScreenProps) {
  const myColor = state.colors.find((color) => color.id === me.colorId)

  return (
    <OrderRollWaitStep
      myDice={orderRollThrows[playerId]}
      colorHex={myColor?.hex ?? '#ffffff'}
      canRoll={state.orderRollState?.playersStillToRoll?.includes(playerId) ?? false}
      onRoll={rollForOrder}
      hostActions={
        me.isHost && (
          <>
            <TvDisplayAccess
              settings={state.tvDisplay}
              defaults={state.tvDisplayDefault}
              onChange={setTvDisplay}
            />
            {/* Alleen tijdens de uitslag-hold: de server is al verder, dit scherm staat nog even
                (useHeldPhase). Daarvoor is er niets door te klikken (The Invisible Design Rule). */}
            {state.phase !== GamePhaseDto.OrderRoll && <SkipTvHoldButton onSkip={skipTvHold} />}
          </>
        )
      }
    />
  )
}
