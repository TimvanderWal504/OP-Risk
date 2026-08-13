import { OrderRollWaitStep } from '../../../components/OrderRollWaitStep'
import type { PhoneScreenProps } from './phoneScreens'

/** Volgorde bepalen (FO §2.1): de eigen worp, met de eigen kleur als accent. */
export function PhoneOrderRollScreen({
  state,
  playerId,
  me,
  error,
  orderRollThrows,
  rollForOrder,
}: PhoneScreenProps) {
  const myColor = state.colors.find((color) => color.id === me.colorId)

  return (
    <OrderRollWaitStep
      myDice={orderRollThrows[playerId]}
      colorHex={myColor?.hex ?? '#ffffff'}
      canRoll={state.orderRollState !== null}
      onRoll={rollForOrder}
      error={error}
    />
  )
}
