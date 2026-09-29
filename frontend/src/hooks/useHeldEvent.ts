import { useEffect, useState } from 'react'
import type { GameStateDto, RecentActionDto } from '../types/GameState'
import { RecentActionKindDto } from '../types/GameState'

/**
 * Hoe lang de gebeurteniskaart op de TV blijft staan (FO §9.2, besluit gebruiker 2026-09-29: 8 s).
 * Presentatietiming, geen spelregel — zelfde soort productbeslissing als `COMBAT_REVEAL_HOLD_MS`.
 */
export const EVENT_CARD_HOLD_MS = 8000

/** Een net getrokken kaart die de TV toont: de kaart en het volgnummer van de trekking in het verloop. */
export interface HeldEvent {
  eventId: string
  sequence: number
}

function latestDraw(actions: RecentActionDto[] | undefined): HeldEvent | null {
  const drawn = actions?.find((action) => action.kind === RecentActionKindDto.EventDrawn && action.eventId)

  return drawn ? { eventId: drawn.eventId!, sequence: drawn.sequence } : null
}

/**
 * TV-only: houdt een net getrokken gebeurteniskaart 8 s vast (DESIGN.md § Event Round). De trekking
 * wordt herkend aan een nieuwe `EventDrawn`-regel in het verloop — het volgnummer onderscheidt ook
 * dezelfde kaart twee keer na een nieuwe schudbeurt.
 *
 * - Alleen een trekking die de TV ziet gebeuren: wat er bij het laden al stond, is geen nieuwe
 *   trekking (een herladen TV toont het bord, niet de kaart opnieuw).
 * - Een gevecht wint: loopt er een gevecht (`combatActive`), dan verdwijnt de kaart en komt hij niet
 *   terug.
 * - Bij legerverlies toont `resolveTvOverlay` de wachtstaat zolang er gekozen wordt; zodra de laatste
 *   keuze binnen is, verdwijnt ook de vastgehouden kaart.
 *
 * Aanpassingen tijdens render, niet in een effect — zelfde patroon als `useHeldCombat`/`useHeldPhase`.
 */
export function useHeldEvent(state: GameStateDto | null, combatActive: boolean): HeldEvent | null {
  const latest = latestDraw(state?.recentActions)
  // `undefined` = nog geen state gezien; `null` = gezien, nog nooit een trekking.
  const [seenSequence, setSeenSequence] = useState<number | null | undefined>(undefined)
  const [held, setHeld] = useState<HeldEvent | null>(null)
  const pending = (state?.pendingAttrition ?? null) !== null
  const [wasPending, setWasPending] = useState(false)

  if (state && seenSequence === undefined) {
    setSeenSequence(latest?.sequence ?? null)
  } else if (latest && seenSequence !== undefined && latest.sequence !== seenSequence) {
    setSeenSequence(latest.sequence)
    setHeld(latest)
  }

  if (combatActive && held !== null) {
    setHeld(null)
  }

  if (pending !== wasPending) {
    setWasPending(pending)
    if (!pending && held !== null) setHeld(null)
  }

  useEffect(() => {
    if (held === null) return

    const timeout = setTimeout(() => setHeld(null), EVENT_CARD_HOLD_MS)

    return () => clearTimeout(timeout)
  }, [held])

  return held
}
