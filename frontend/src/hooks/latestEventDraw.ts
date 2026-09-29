import type { RecentActionDto } from '../types/GameState'
import { RecentActionKindDto } from '../types/GameState'

/** Een trekking uit het verloop: de kaart en het volgnummer van de `EventDrawn`-regel. */
export interface EventDraw {
  eventId: string
  sequence: number
}

/**
 * De nieuwste trekking in het verloop (nieuwste eerst), of `null`. Het volgnummer onderscheidt ook
 * dezelfde kaart twee keer na een nieuwe schudbeurt. Gedeeld door de TV (`useHeldEvent`) en de
 * telefoon (`useEventDrawNotice`), zodat beide een trekking op dezelfde manier herkennen.
 */
export function latestEventDraw(actions: RecentActionDto[] | undefined): EventDraw | null {
  const drawn = actions?.find((action) => action.kind === RecentActionKindDto.EventDrawn && action.eventId)

  return drawn ? { eventId: drawn.eventId!, sequence: drawn.sequence } : null
}
