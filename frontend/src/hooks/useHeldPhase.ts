import { useEffect, useState } from 'react'
import { GamePhaseDto } from '../types/GameState'

/**
 * De server schuift meteen door zodra de laatste order-roll-worp de winnaar oplevert (FO §2.1)
 * — zonder deze hold zou de TV/telefoon dat moment nooit tonen.
 *
 * Deze duur komt niet uit `motion.ts`: het is een productbeslissing (uitzondering vastgelegd in
 * frontend/CLAUDE.md), geen designwaarde. De client mag presentatietiming bevatten (hóé lang
 * een al genomen serverbeslissing zichtbaar blijft), maar geen spelregels (wat mag en hoeveel)
 * — de uitkomst verandert er niet door en er wordt niet op de server vooruitgelopen. Zou de
 * reveal-duur een echte spelregel worden, dan is dat eerst een FO-aanvulling en daarna een
 * serverfase met eigen timer.
 */
const ORDER_ROLL_REVEAL_HOLD_MS = 5000

/**
 * Houdt `GamePhaseDto.OrderRoll` nog even als weergavefase vast nadat de server al naar
 * de volgende fase is gegaan, zodat de bepaalde spelersvolgorde zichtbaar blijft.
 *
 * `skipSignal` telt op zodra de host "Verder op TV" kiest (FO §2.2): dan eindigt de hold meteen.
 */
export function useHeldPhase(phase: GamePhaseDto | undefined, skipSignal = 0): GamePhaseDto | undefined {
  const [displayPhase, setDisplayPhase] = useState(phase)
  const [heldPhase, setHeldPhase] = useState(phase)
  const [seenSkip, setSeenSkip] = useState(skipSignal)

  if (skipSignal !== seenSkip) {
    setSeenSkip(skipSignal)
    if (phase !== undefined && displayPhase !== phase) setDisplayPhase(phase)
  }

  if (phase !== undefined && phase !== heldPhase) {
    setHeldPhase(phase)

    if (displayPhase !== GamePhaseDto.OrderRoll) {
      setDisplayPhase(phase)
    }
  }

  useEffect(() => {
    if (displayPhase !== GamePhaseDto.OrderRoll) return
    if (phase === undefined || phase === displayPhase) return

    const timeout = setTimeout(() => setDisplayPhase(phase), ORDER_ROLL_REVEAL_HOLD_MS)

    return () => clearTimeout(timeout)
  }, [phase, displayPhase])

  return displayPhase
}
