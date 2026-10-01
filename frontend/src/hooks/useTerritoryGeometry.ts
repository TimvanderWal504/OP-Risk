import { loadTerritoryGeometry } from '../map/loadTerritoryGeometry'
import { createSessionResource } from './createSessionResource'

/**
 * Fetcht/cachet de kaartgeometrie van één kaartvariant (`GameStateDto.mapId`) eenmalig per
 * sessie via `loadTerritoryGeometry`, zodat een remount van het TV-bord niet opnieuw fetcht.
 */
export const useTerritoryGeometry = createSessionResource(loadTerritoryGeometry)
