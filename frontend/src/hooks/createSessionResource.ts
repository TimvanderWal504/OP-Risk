import { useEffect, useState } from 'react'

export interface SessionResourceState<T> {
  data: T | null
  loading: boolean
  error: boolean
}

/**
 * Maakt een hook die `load(key)` hoogstens één keer per sessie per sleutel uitvoert en het
 * resultaat in een closure-cache bewaart — voor statische kaartdata (geometrie, grenzen) die
 * binnen een sessie nooit verandert, zodat een remount van het TV-bord (fasewissel) niet
 * opnieuw fetcht. De sleutel is de kaartvariant (`GameStateDto.mapId`, FO §4.5): elke kaart
 * heeft zijn eigen cache-ingang. Mislukt het laden, dan staat `error` op true voor die mount en
 * die sleutel, en probeert de volgende mount het opnieuw.
 */
export function createSessionResource<T>(load: (key: string) => Promise<T>): (key: string) => SessionResourceState<T> {
  const cache = new Map<string, T>()
  const inFlight = new Map<string, Promise<T>>()

  return function useSessionResource(key: string): SessionResourceState<T> {
    // Het geladen resultaat onthoudt bij welke sleutel het hoort: wisselt de sleutel, dan
    // telt een resultaat van de vorige sleutel niet meer mee.
    const [loaded, setLoaded] = useState<{ key: string; data: T } | null>(null)
    const [failedKey, setFailedKey] = useState<string | null>(null)

    useEffect(() => {
      // Geen synchrone setLoaded(cache) hier: de render leest de cache al rechtstreeks
      // (hieronder) — een extra set zou alleen react-hooks/set-state-in-effect triggeren.
      if (cache.has(key)) return

      let cancelled = false

      let request = inFlight.get(key)
      if (!request) {
        request = load(key)
        inFlight.set(key, request)
      }

      request
        .then((data) => {
          cache.set(key, data)
          if (!cancelled) setLoaded({ key, data })
        })
        .catch(() => {
          inFlight.delete(key)
          if (!cancelled) setFailedKey(key)
        })

      return () => {
        cancelled = true
      }
    }, [key])

    // Op aanwezigheid in de cache, niet op truthiness: ook een geladen `0`, `''` of `false` telt
    // als geladen.
    const isCached = cache.has(key)
    const isLoaded = isCached || loaded?.key === key
    const data = isCached ? (cache.get(key) as T) : loaded?.key === key ? loaded.data : null
    const error = !isLoaded && failedKey === key

    return { data, loading: !isLoaded && !error, error }
  }
}
