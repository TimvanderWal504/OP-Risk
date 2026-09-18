import { project, shiftRingForKamchatka, type LonLat } from './projection'
import { loadTerritoryFeatures, ringsOf, type TerritoryFeature } from './territoryFeatures'

export interface TerritoryOutline {
  /** Vaste, kaart-onafhankelijke viewBox — zie `VIEWBOX_SIZE`. */
  viewBox: string
  pathD: string
}

/**
 * Per gebied genormaliseerde omlijning voor de derde deel-tegel van `TerritoryCardTile`
 * (taak 5-vervolg): niet de kaart-schaal-coördinaten die `loadTerritoryGeometry` voor het
 * TV-bord gebruikt (die lopen op tot 4096×1832px en variëren enorm in grootte per gebied,
 * van IJsland tot Rusland), maar één klein, gebied-eigen coördinatenstelsel met behouden
 * aspect ratio, gecentreerd binnen een vaste `VIEWBOX_SIZE`×`VIEWBOX_SIZE`-viewBox.
 */
const VIEWBOX_SIZE = 64
const PADDING = 4

function toOutline(feature: TerritoryFeature): TerritoryOutline {
  const rings = ringsOf(feature.geometry)
  const shiftedRings = feature.properties.id === 'kamchatka' ? rings.map(shiftRingForKamchatka) : rings
  const projectedRings = shiftedRings.map((ring: LonLat[]) => ring.map(([lon, lat]) => project(lon, lat)))
  const allPoints = projectedRings.flat()

  const minX = Math.min(...allPoints.map((p) => p.x))
  const maxX = Math.max(...allPoints.map((p) => p.x))
  const minY = Math.min(...allPoints.map((p) => p.y))
  const maxY = Math.max(...allPoints.map((p) => p.y))

  // Aspect behouden: schaal op de langste zijde, kleinere zijde blijft binnen de padding over.
  const width = maxX - minX || 1
  const height = maxY - minY || 1
  const drawableSize = VIEWBOX_SIZE - PADDING * 2
  const scale = drawableSize / Math.max(width, height)
  const offsetX = (VIEWBOX_SIZE - width * scale) / 2
  const offsetY = (VIEWBOX_SIZE - height * scale) / 2

  const pathD = projectedRings
    .map((ring) => {
      const points = ring
        .map(({ x, y }) => {
          const nx = (x - minX) * scale + offsetX
          const ny = (y - minY) * scale + offsetY

          return `${nx.toFixed(1)},${ny.toFixed(1)}`
        })
        .join(' L ')

      return `M ${points} Z`
    })
    .join(' ')

  return { viewBox: `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`, pathD }
}

/**
 * Alle omlijningen in één keer, per territorium-id — zelfde bron-GeoJSON als het TV-bord
 * (`loadTerritoryFeatures`, geen tweede waarheidsbron). MultiPolygon-gebieden (eilandengroepen)
 * krijgen alle ringen binnen dezelfde bounding box/schaal, zodat de relatieve positie/grootte
 * van de eilanden onderling klopt.
 */
export async function loadTerritoryOutlines(mapId = 'standaard-43'): Promise<Record<string, TerritoryOutline>> {
  const collection = await loadTerritoryFeatures(mapId)
  const outlines: Record<string, TerritoryOutline> = {}

  for (const feature of collection.features) {
    outlines[feature.properties.id] = toOutline(feature)
  }

  return outlines
}
