import { useEffect, useState } from 'react'
import { loadTerritoryGeometry } from '../map/loadTerritoryGeometry'
import type { TerritoryGeometry } from '../map/loadTerritoryGeometry'

interface TerritoryGeometryState {
  data: TerritoryGeometry[] | null
  loading: boolean
  error: boolean
}

// Module-scope cache: de kaartgeometrie verandert nooit binnen een sessie (één vaste
// kaartvariant, "standaard-43"), dus een remount van het TV-bord mag niet opnieuw fetchen.
let cachedGeometry: TerritoryGeometry[] | null = null
let inFlight: Promise<TerritoryGeometry[]> | null = null

/** Fetcht/cachet de kaartgeometrie eenmalig per sessie via `loadTerritoryGeometry`. */
export function useTerritoryGeometry(): TerritoryGeometryState {
  const [data, setData] = useState<TerritoryGeometry[] | null>(cachedGeometry)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Geen synchrone setData(cachedGeometry) hier: de useState-initializer hierboven leest
    // cachedGeometry al bij mount, en tussen die render en het draaien van dit effect kan de
    // cache niet alsnog gevuld raken (single-threaded, geen await ertussen) — een extra
    // synchrone set zou alleen react-hooks/set-state-in-effect triggeren zonder nut.
    if (cachedGeometry) return

    let cancelled = false

    inFlight ??= loadTerritoryGeometry()

    inFlight
      .then((geometry) => {
        cachedGeometry = geometry
        if (!cancelled) setData(geometry)
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
