import { useEffect, useState } from 'react'

export interface CountdownInput {
  remainingMs: number
  isPaused: boolean
}

const TICK_MS = 250

/**
 * Aftel-arithmetiek voor `TurnTimerDto` (TV én telefoon delen deze berekening — feit 2 in het
 * plan: één gedeelde Reinforce+Attack-timer). Puur presentatie: de server bepaalt de
 * daadwerkelijke fase-overgang (`TurnTimerBackgroundService`), deze hook telt alleen zichtbaar
 * af tussen twee `GameStateUpdated`-pushes in.
 *
 * Twee gescheiden mechanismen, bewust niet gecombineerd:
 * - `displayMs` snapt tijdens render naar de nieuwe `remainingMs` zodra `timer` wijzigt (zelfde
 *   "vergelijk en pas aan"-patroon als `useHeldPhase.ts`) — puur, geen `Date.now()`, dus
 *   toegestaan tijdens render (react-hooks/purity).
 * - Het aftellen zelf (elke `TICK_MS`) leest de klok uitsluitend binnen het effect/interval,
 *   nooit tijdens render. `Date.now()` is impure en mag render nooit beïnvloeden; een monotone
 *   anchor i.p.v. een lokale decrement-teller zorgt dat gemiste ticks (tab in de achtergrond,
 *   trage her-render) nooit optellen tot drift. Nooit negatief — de server-clamp in
 *   `GameStateDtoMapper` kan al 0 leveren, en de tijd die tussen twee pushes verstrijkt mag dat
 *   niet onderschrijden.
 */
export function useCountdown(timer: CountdownInput | null | undefined): number {
  const [seenTimerKey, setSeenTimerKey] = useState<string | null>(null)
  const [displayMs, setDisplayMs] = useState(() => Math.max(0, timer?.remainingMs ?? 0))

  const timerKey = timer ? `${timer.remainingMs}:${timer.isPaused}` : null
  if (timerKey !== seenTimerKey) {
    setSeenTimerKey(timerKey)
    setDisplayMs(Math.max(0, timer?.remainingMs ?? 0))
  }

  const remainingMs = timer?.remainingMs
  const isPaused = timer?.isPaused

  useEffect(() => {
    if (remainingMs === undefined || isPaused) return undefined

    const anchor = { remainingMs, atMs: Date.now() }

    const interval = setInterval(() => {
      const elapsed = Date.now() - anchor.atMs
      const next = Math.max(0, anchor.remainingMs - elapsed)
      setDisplayMs(next)
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [remainingMs, isPaused])

  return displayMs
}
