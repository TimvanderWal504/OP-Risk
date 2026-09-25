import { loadTerritoryGeometry } from '../map/loadTerritoryGeometry'
import { createSessionResource } from './createSessionResource'

/**
 * Fetcht/cachet de kaartgeometrie eenmalig per sessie via `loadTerritoryGeometry` — één vaste
 * kaartvariant ("standaard-43"), dus een remount van het TV-bord mag niet opnieuw fetchen.
 */
export const useTerritoryGeometry = createSessionResource(() => loadTerritoryGeometry())
