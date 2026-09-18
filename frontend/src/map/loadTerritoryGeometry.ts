import { project, ringToPath, shiftRingForKamchatka } from './projection'
import { loadTerritoryFeatures, ringsOf, type TerritoryFeature } from './territoryFeatures'

export interface TerritoryGeometry {
  id: string
  continent: string
  centroidPx: { x: number; y: number }
  pathD: string
}

/**
 * Zet één GeoJSON-feature om naar renderbare pixelgeometrie via `projection.ts`. De
 * Kamchatka-vouw wordt uitsluitend toegepast op basis van het territorium-id — zelfde
 * aanroepvoorwaarde als `build_silhouette_v4.py`'s `geom_to_paths` (`if tid == 'kamchatka'`),
 * niet op basis van een generieke lengtegraad-heuristiek (zie `projection.ts`).
 *
 * `properties.centroid` is in de brondata al post-vouw: het is de oppervlakte-gewogen
 * centroïde over alle ringen ná `shiftRingForKamchatka`, en gaat dus rechtstreeks door
 * `project` heen. Hier nog een keer vouwen mag niet — voor Kamchatka's centroïde (164,55°)
 * grijpt geen van de takken in `shiftRingForKamchatka`, en zou +360 er 524,55° van maken.
 */
function toTerritoryGeometry(feature: TerritoryFeature): TerritoryGeometry {
  const { id, continent, centroid } = feature.properties
  const rings = ringsOf(feature.geometry)
  const shiftedRings = id === 'kamchatka' ? rings.map(shiftRingForKamchatka) : rings
  const [centroidLon, centroidLat] = centroid

  return {
    id,
    continent,
    centroidPx: project(centroidLon, centroidLat),
    pathD: shiftedRings.map(ringToPath).join(' '),
  }
}

export async function loadTerritoryGeometry(mapId = 'standaard-43'): Promise<TerritoryGeometry[]> {
  const collection = await loadTerritoryFeatures(mapId)
  return collection.features.map(toTerritoryGeometry)
}
