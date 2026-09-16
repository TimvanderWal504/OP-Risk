import type { TurnTimerDto } from '../types/GameState'
import { useCountdown } from './useCountdown'

/**
 * Zelfde drempel als `TurnStatusHeader.tsx` (TV) — geen brontabel hiervoor, zie de doc-comment
 * daar ("productbeslissing, geen designwaarde").
 */
const TIMER_LOW_THRESHOLD_MS = 60_000

/** Zelfde aftel-/formatteerlogica als `TurnStatusHeader.tsx`. Lokale helper i.p.v. een gedeeld
 *  util-bestand: dat is al het gevestigde patroon in deze codebase (zie ook `CreateGameForm.tsx`'s
 *  eigen, andere `formatTimer`) — geen ongevraagde refactor naar een nieuwe gedeelde plek. */
function formatTimer(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export interface PhoneHeaderTimer {
  /** `null` zolang de fase geen beurttimer kent (Claiming/InitialPlacement) — zie
   *  `PlayerHeader.timer`'s doc-comment. */
  timer: string | null
  timerState: 'normal' | 'low' | 'paused'
}

/**
 * `PlayerHeader`'s beurttimer-props, afgeleid van `TurnStateDto.timer` (alleen gevuld tijdens
 * `GamePhaseDto.InProgress`, TO §4.2/§9) — dezelfde berekening die `TurnStatusHeader.tsx` al
 * voor de TV gebruikt, nu voor het eerst ook op de telefoon.
 */
export function usePhoneHeaderTimer(timer: TurnTimerDto | null): PhoneHeaderTimer {
  const remainingMs = useCountdown(timer)

  if (timer === null) return { timer: null, timerState: 'normal' }
  if (timer.isPaused) return { timer: formatTimer(remainingMs), timerState: 'paused' }

  return { timer: formatTimer(remainingMs), timerState: remainingMs < TIMER_LOW_THRESHOLD_MS ? 'low' : 'normal' }
}
