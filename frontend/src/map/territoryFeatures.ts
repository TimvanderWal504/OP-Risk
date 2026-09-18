import type { LonLat } from './projection'
import { apiUrl } from '../config/apiConfig'

/** `data/maps/standaard-43/territories.geo.json` — GeoJSON-subset die deze taak nodig heeft. */
export interface TerritoryFeature {
  properties: {
    id: string
    continent: string
    centroid: LonLat
  }
  geometry:
    | { type: 'Polygon'; coordinates: LonLat[][] }
    | { type: 'MultiPolygon'; coordinates: LonLat[][][] }
}

export interface TerritoryFeatureCollection {
  type: 'FeatureCollection'
  features: TerritoryFeature[]
}

/** Ringen van één feature, plat, ongeacht Polygon vs. MultiPolygon. */
export function ringsOf(geometry: TerritoryFeature['geometry']): LonLat[][] {
  return geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
}

/**
 * Gedeelde fetch+parse-stap, gebruikt door zowel `loadTerritoryGeometry` (TV-bord, kaart-
 * schaal-coördinaten) als `loadTerritoryOutlines` (genormaliseerde kaart-tegel-omlijningen) —
 * beide lezen dezelfde bron-GeoJSON, geen tweede fetch-implementatie (DRY, src/CLAUDE.md).
 */
export async function loadTerritoryFeatures(mapId = 'standaard-43'): Promise<TerritoryFeatureCollection> {
  const response = await fetch(apiUrl(`/maps/${mapId}/territories.geo.json`))
  if (!response.ok) {
    throw new Error(`Kaartgeometrie voor '${mapId}' kon niet geladen worden (${response.status}).`)
  }

  return (await response.json()) as TerritoryFeatureCollection
}
