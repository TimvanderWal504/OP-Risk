import { useMemo } from 'react'
import type { TerritoryGeometry } from '../map/loadTerritoryGeometry'
import { loadSeaRoutes, toSeaRouteSegments, type SeaRouteSegment } from '../map/seaRoutes'
import { createSessionResource } from './createSessionResource'

const useSeaRouteData = createSessionResource(() => loadSeaRoutes())

/**
 * De zeeverbindingen als lijnstukken op de kaart, zodra zowel de grenzen als de geometrie
 * geladen zijn. Mislukt het laden, dan blijft de lijst leeg: het bord is zonder deze lijnen
 * volledig speelbaar, dus geen foutstaat naar buiten — de volgende mount probeert het opnieuw.
 */
export function useSeaRoutes(geometry: TerritoryGeometry[] | null | undefined): SeaRouteSegment[] {
  const { data: routes } = useSeaRouteData()

  return useMemo(() => (routes && geometry ? toSeaRouteSegments(routes, geometry) : []), [routes, geometry])
}
