import { apiUrl } from '../config/apiConfig'
import type { TerritoryGeometry } from './loadTerritoryGeometry'
import { LON_MAX, LON_MIN, MAP_WIDTH_PX, type ProjectedPoint } from './projection'

/** Eén `border`-entry uit `data/maps/{mapId}/adjacency_validated.json` (FO §4.2). */
interface Border {
  from: string
  to: string
  type: 'land' | 'sea'
}

export interface SeaRoute {
  from: string
  to: string
}

export interface SeaRouteSegment {
  key: string
  /** Altijd een gebiedscentroïde. */
  from: ProjectedPoint
  to: ProjectedPoint
  /** `to` ligt op de kaartrand (stompje over de datumgrens), niet op een centroïde. */
  toIsEdge: boolean
}

/** Eén volle omwenteling (360°) in viewBox-eenheden — de kaart is lineair in lengtegraad. */
const FULL_TURN_PX = (360 / (LON_MAX - LON_MIN)) * MAP_WIDTH_PX

/** Alleen de zeeverbindingen; landgrenzen krijgen bewust geen lijn (FO §4.3, zie DESIGN.md). */
export async function loadSeaRoutes(mapId = 'standaard-43'): Promise<SeaRoute[]> {
  const response = await fetch(apiUrl(`/maps/${mapId}/adjacency_validated.json`))
  if (!response.ok) {
    throw new Error(`Grenzen voor '${mapId}' konden niet geladen worden (${response.status}).`)
  }

  const { borders } = (await response.json()) as { borders: Border[] }

  return borders.filter((border) => border.type === 'sea').map(({ from, to }) => ({ from, to }))
}

/** Ligt `x` binnen de kaart (inclusief de randen)? */
function isOnMap(x: number): boolean {
  return x >= 0 && x <= MAP_WIDTH_PX
}

/** Knipt het lijnstuk `from → to` (met `to` buiten de kaart) af op de linker- of rechterrand. */
function clipToMapEdge(from: ProjectedPoint, to: ProjectedPoint): ProjectedPoint {
  const edgeX = to.x < 0 ? 0 : MAP_WIDTH_PX
  const t = (edgeX - from.x) / (to.x - from.x)

  return { x: edgeX, y: from.y + t * (to.y - from.y) }
}

/**
 * Zet zeeroutes om naar lijnstukken tussen de gebiedscentroïden (FO §4.3). Een route die korter
 * is via de andere kant van de wereld (Alaska–Kamchatka, Nieuw-Zeeland–Argentinië: meer dan
 * een halve omwenteling uit elkaar) wordt twee stompjes, elk vanaf één centroïde richting de
 * kaartrand waar de partner "achter" ligt — zoals op een klassiek Risk-bord. Het kaartvenster
 * beslaat meer dan 360° (TO §7.2), dus een verschoven partner kan óp de kaart vallen; dan is er
 * geen rand om naartoe te wijzen en wordt het gewoon één lijn. Een route met een onbekend gebied
 * wordt overgeslagen.
 */
export function toSeaRouteSegments(routes: SeaRoute[], geometry: TerritoryGeometry[]): SeaRouteSegment[] {
  const centroids = new Map(geometry.map((territory) => [territory.id, territory.centroidPx]))

  return routes.flatMap(({ from, to }) => {
    const a = centroids.get(from)
    const b = centroids.get(to)
    if (!a || !b) return []

    const key = `${from}--${to}`
    const direct = [{ key, from: a, to: b, toIsEdge: false }]
    const dx = b.x - a.x

    if (Math.abs(dx) <= FULL_TURN_PX / 2) return direct

    const shift = dx > 0 ? -FULL_TURN_PX : FULL_TURN_PX
    const ghostB = { x: b.x + shift, y: b.y }
    const ghostA = { x: a.x - shift, y: a.y }

    if (isOnMap(ghostB.x) || isOnMap(ghostA.x)) return direct

    return [
      { key: `${key}--a`, from: a, to: clipToMapEdge(a, ghostB), toIsEdge: true },
      { key: `${key}--b`, from: b, to: clipToMapEdge(b, ghostA), toIsEdge: true },
    ]
  })
}

/**
 * Kort een lijnstuk in met `inset` aan elk centroïde-uiteinde, zodat de lijn bij de rand van de
 * legerschijf stopt i.p.v. erdoorheen te lopen; een kaartrand-uiteinde blijft staan. Een stuk
 * dat daarna niets meer overhoudt (twee schijven die elkaar raken) valt weg.
 */
export function trimSeaRouteSegment(segment: SeaRouteSegment, inset: number): SeaRouteSegment | null {
  const dx = segment.to.x - segment.from.x
  const dy = segment.to.y - segment.from.y
  const length = Math.hypot(dx, dy)
  const endInset = segment.toIsEdge ? 0 : inset

  if (length <= inset + endInset) return null

  const ux = dx / length
  const uy = dy / length

  return {
    ...segment,
    from: { x: segment.from.x + ux * inset, y: segment.from.y + uy * inset },
    to: { x: segment.to.x - ux * endInset, y: segment.to.y - uy * endInset },
  }
}
