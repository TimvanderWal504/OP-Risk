import { useEffect, useState } from 'react'

export interface SessionResourceState<T> {
  data: T | null
  loading: boolean
  error: boolean
}

/**
 * Maakt een hook die `load` hoogstens één keer per sessie uitvoert en het resultaat in een
 * closure-cache bewaart — voor statische kaartdata (geometrie, grenzen) die binnen een sessie
 * nooit verandert, zodat een remount van het TV-bord (fasewissel) niet opnieuw fetcht. Mislukt
 * het laden, dan staat `error` op true voor die mount en probeert de volgende mount het opnieuw.
 */
export function createSessionResource<T>(load: () => Promise<T>): () => SessionResourceState<T> {
  let cached: T | null = null
  let inFlight: Promise<T> | null = null

  return function useSessionResource(): SessionResourceState<T> {
    const [data, setData] = useState<T | null>(cached)
    const [error, setError] = useState(false)

    useEffect(() => {
      // Geen synchrone setData(cached) hier: de useState-initializer hierboven leest de cache
      // al bij mount, en tussen die render en dit effect kan hij niet alsnog gevuld raken
      // (single-threaded, geen await ertussen) — een extra set zou alleen
      // react-hooks/set-state-in-effect triggeren zonder nut.
      if (cached) return

      let cancelled = false

      inFlight ??= load()

      inFlight
        .then((loaded) => {
          cached = loaded
          if (!cancelled) setData(loaded)
        })
        .catch(() => {
          inFlight = null
          if (!cancelled) setError(true)
        })

      return () => {
        cancelled = true
      }
    }, [])

    return { data, loading: !data && !error, error }
  }
}
