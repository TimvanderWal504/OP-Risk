import { project, ringToPath, shiftRingForKamchatka } from './projection'
import type { LonLat } from './projection'

/** `data/maps/standaard-43/territories.geo.json` — GeoJSON-subset die deze taak nodig heeft. */
interface TerritoryFeature {
  properties: {
    id: string
    continent: string
    centroid: LonLat
  }
  geometry:
    | { type: 'Polygon'; coordinates: LonLat[][] }
    | { type: 'MultiPolygon'; coordinates: LonLat[][][] }
}

interface TerritoryFeatureCollection {
  type: 'FeatureCollection'
  features: TerritoryFeature[]
}

export interface TerritoryGeometry {
  id: string
  continent: string
  centroidPx: { x: number; y: number }
  pathD: string
}

/** Ringen van één feature, plat, ongeacht Polygon vs. MultiPolygon. */
function ringsOf(geometry: TerritoryFeature['geometry']): LonLat[][] {
  return geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
}

/**
 * Zet één GeoJSON-feature om naar renderbare pixelgeometrie via `projection.ts`. De
 * Kamchatka-vouw wordt uitsluitend toegepast op basis van het territorium-id — zelfde
 * aanroepvoorwaarde als `build_silhouette_v4.py`'s `geom_to_paths` (`if tid == 'kamchatka'`),
 * niet op basis van een generieke lengtegraad-heuristiek (zie `projection.ts`).
 */
function toTerritoryGeometry(feature: TerritoryFeature): TerritoryGeometry {
  const { id, continent, centroid } = feature.properties
  const rings = ringsOf(feature.geometry)
  const isKamchatka = id === 'kamchatka'
  const shiftedRings = isKamchatka ? rings.map(shiftRingForKamchatka) : rings
  const [centroidLon, centroidLat] = isKamchatka ? shiftRingForKamchatka([centroid])[0] : centroid

  return {
    id,
    continent,
    centroidPx: project(centroidLon, centroidLat),
    pathD: shiftedRings.map(ringToPath).join(' '),
  }
}

export async function loadTerritoryGeometry(mapId = 'standaard-43'): Promise<TerritoryGeometry[]> {
  const response = await fetch(`/maps/${mapId}/territories.geo.json`)
  if (!response.ok) {
    throw new Error(`Kaartgeometrie voor '${mapId}' kon niet geladen worden (${response.status}).`)
  }

  const collection = (await response.json()) as TerritoryFeatureCollection
  return collection.features.map(toTerritoryGeometry)
}
