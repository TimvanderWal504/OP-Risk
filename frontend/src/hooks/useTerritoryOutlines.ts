import { useEffect, useState } from 'react'
import { loadTerritoryOutlines } from '../map/loadTerritoryOutlines'
import type { TerritoryOutline } from '../map/loadTerritoryOutlines'

// Module-scope cache, zelfde patroon als `useTerritoryGeometry`: de omlijningen veranderen
// nooit binnen een sessie (één vaste kaartvariant), dus een tweede keer "Mijn kaarten" openen
// mag niet opnieuw fetchen. Bewust lazy (pas bij de eerste render van deze hook), niet eager
// via `useGameState.tsx` zoals `territoryCatalog` — het bron-GeoJSON is ~1,87MB, te zwaar om
// voor elke speler bij elk spel te laden terwijl niet iedereen ooit "Mijn kaarten" opent.
let cachedOutlines: Record<string, TerritoryOutline> | null = null
let inFlight: Promise<Record<string, TerritoryOutline>> | null = null

/**
 * Fetcht/cachet de genormaliseerde territorium-omlijningen (taak 5-vervolg, deel 3 van de
 * kaart-tegel) eenmalig per sessie. Retourneert `null` zolang de fetch loopt of nog niet is
 * gestart — `TerritoryCardTile` toont dan gewoon een leeg derde deel, geen foutstaat.
 */
export function useTerritoryOutlines(): Record<string, TerritoryOutline> | null {
  const [data, setData] = useState<Record<string, TerritoryOutline> | null>(cachedOutlines)

  useEffect(() => {
    if (cachedOutlines) return

    let cancelled = false

    inFlight ??= loadTerritoryOutlines()

    inFlight
      .then((outlines) => {
        cachedOutlines = outlines
        if (!cancelled) setData(outlines)
      })
      .catch(() => {
        inFlight = null
      })

    return () => {
      cancelled = true
    }
  }, [])

  return data
}
