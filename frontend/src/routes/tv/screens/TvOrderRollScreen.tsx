import { OrderRollTvPanel } from '../../../components/OrderRollTvPanel'
import type { TvScreenProps } from './tvScreens'

/** Volgorde bepalen op de TV (FO §2.1): elke worp en de resulterende spelersvolgorde. */
export function TvOrderRollScreen({ state, orderRollThrows }: TvScreenProps) {
  return (
    <div className="flex h-full flex-col mx-auto max-w-[1550px] p-14 items-center justify-center">
      <OrderRollTvPanel
        players={state.players}
        colors={state.colors}
        throws={orderRollThrows}
        order={state.turnOrder}
      />
    </div>
  )
}
