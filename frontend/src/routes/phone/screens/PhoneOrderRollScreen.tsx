import { OrderRollWaitStep } from '../../../components/OrderRollWaitStep'
import { TvDisplayAccess } from '../../../components/TvDisplayAccess'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Volgorde bepalen (FO §2.1): de eigen worp, met de eigen kleur als accent. De host kan hier ook
 * de TV-weergave bijstellen (plan-testronde-tv punt 2) — deze fase heeft geen `PhonePlayerHeader`.
 */
export function PhoneOrderRollScreen({
  state,
  playerId,
  me,
  error,
  orderRollThrows,
  rollForOrder,
  setTvDisplay,
}: PhoneScreenProps) {
  const myColor = state.colors.find((color) => color.id === me.colorId)

  return (
    <OrderRollWaitStep
      myDice={orderRollThrows[playerId]}
      colorHex={myColor?.hex ?? '#ffffff'}
      canRoll={state.orderRollState?.playersStillToRoll?.includes(playerId) ?? false}
      onRoll={rollForOrder}
      error={error}
      hostActions={
        me.isHost && (
          <TvDisplayAccess
            settings={state.tvDisplay}
            defaults={state.tvDisplayDefault}
            onChange={setTvDisplay}
            error={error}
          />
        )
      }
    />
  )
}
