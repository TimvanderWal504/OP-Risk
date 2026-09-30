import { useCallback, useState } from 'react'
import type { HeldEvent } from './useHeldEvent'

/** Wat de gebeurteniskaart-overlay toont: welke kaart, en de trekking erbij als de TV die vasthoudt. */
export interface ShownEvent {
  eventId: string
  draw: HeldEvent | null
}

/**
 * TV-only: laat de gebeurteniskaart nog één `overlayOut` lang staan nadat hij weg moet (DESIGN.md
 * § Event Round: "Held 8 s, then `overlayOut`"): na de houdtijd, na "Verder op TV", of na de laatste
 * attrition-keuze. Een gevecht dat de kaart vervangt krijgt geen uitgang — het gevecht wint meteen.
 *
 * `leaving` is de kaart die nu uitgaat; `onLeft` ruimt hem op zodra de animatie klaar is
 * (`animationend`, zelfde patroon als `TvStageBackground`). Zo staat er geen duur dubbel naast
 * `motion.ts`. Aanpassingen tijdens render, zelfde patroon als `useHeldEvent`.
 */
export function useEventOverlayExit(
  shown: ShownEvent | null,
  replacedByCombat: boolean,
): { leaving: ShownEvent | null; onLeft: () => void } {
  const [last, setLast] = useState<ShownEvent | null>(shown)
  const [leaving, setLeaving] = useState<ShownEvent | null>(null)

  if (shown !== null) {
    if (!sameShown(last, shown)) setLast(shown)
    if (leaving !== null) setLeaving(null)
  } else if (last !== null) {
    setLast(null)
    if (!replacedByCombat) setLeaving(last)
  }

  if (replacedByCombat && leaving !== null) setLeaving(null)

  const onLeft = useCallback(() => setLeaving(null), [])

  return { leaving, onLeft }
}

function sameShown(a: ShownEvent | null, b: ShownEvent): boolean {
  return a !== null && a.eventId === b.eventId && a.draw?.sequence === b.draw?.sequence
}
