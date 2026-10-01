import { loadTerritoryOutlines } from '../map/loadTerritoryOutlines'
import type { TerritoryOutline } from '../map/loadTerritoryOutlines'
import { createSessionResource } from './createSessionResource'

// Sessiecache per kaartvariant, zelfde mechanisme als `useTerritoryGeometry`: een tweede keer
// "Mijn kaarten" openen mag niet opnieuw fetchen. Bewust lazy (pas bij de eerste render van
// deze hook), niet eager via `useGameState.tsx` zoals `territoryCatalog` — het bron-GeoJSON
// is ~1,8MB, te zwaar om voor elke speler bij elk spel te laden terwijl niet iedereen ooit
// "Mijn kaarten" opent.
const useOutlineResource = createSessionResource(loadTerritoryOutlines)

/**
 * De genormaliseerde territorium-omlijningen (deel 2 van de kaart-tegel) van kaartvariant
 * `mapId`. Retourneert `null` zolang de fetch loopt of mislukt is — `TerritoryCardTile` toont
 * dan gewoon een leeg deel, geen foutstaat.
 */
export function useTerritoryOutlines(mapId: string): Record<string, TerritoryOutline> | null {
  return useOutlineResource(mapId).data
}
