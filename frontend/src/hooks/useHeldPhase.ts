import { useEffect, useState } from 'react'
import { GamePhaseDto } from '../types/GameState'

/**
 * De server schuift meteen door zodra de laatste order-roll-worp de winnaar oplevert
 * (FO §2.1) — zonder deze hold zou de TV/telefoon dat moment nooit tonen. Puur een
 * weergavevertraging: de server-state zelf loopt niet vooruit (frontend/CLAUDE.md,
 * "Beweging wordt gedreven door server-state").
 */
const ORDER_ROLL_REVEAL_HOLD_MS = 8000

/**
 * Houdt `GamePhaseDto.OrderRoll` nog even als weergavefase vast nadat de server al naar
 * de volgende fase is gegaan, zodat de bepaalde spelersvolgorde zichtbaar blijft.
 */
export function useHeldPhase(phase: GamePhaseDto | undefined): GamePhaseDto | undefined {
  const [displayPhase, setDisplayPhase] = useState(phase)

  useEffect(() => {
    if (phase === undefined || phase === displayPhase) return

    if (displayPhase === GamePhaseDto.OrderRoll) {
      const timeout = setTimeout(() => setDisplayPhase(phase), ORDER_ROLL_REVEAL_HOLD_MS)

      return () => clearTimeout(timeout)
    }

    setDisplayPhase(phase)
  }, [phase, displayPhase])

  return displayPhase
}
