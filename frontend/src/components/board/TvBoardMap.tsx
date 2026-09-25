import type { ReactNode } from 'react'
import type { TerritoryGeometry } from '../../map/loadTerritoryGeometry'
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from '../../map/projection'
import { atlasRough, seaRoute } from '../../map/boardVisualTokens'
import { trimSeaRouteSegment, type SeaRouteSegment } from '../../map/seaRoutes'
import { GlassPanel } from '../ui/GlassPanel'

export interface TerritoryFillVisual {
  fillHex: string
  fillOpacity: number
  strokeHex: string
  strokeOpacity: number
  strokeWidth: number
  /** CSS `drop-shadow`-blur in viewBox-eenheden; kleurt met `glowColor` (default `fillHex`). */
  glowPx?: number
  glowColor?: string
}

interface TvBoardMapProps {
  geometry: TerritoryGeometry[] | null | undefined
  /** Uniek per scherm (meerdere kaartinstanties mogen niet dezelfde `<filter id>` delen). */
  filterId: string
  getTerritoryVisual: (territory: TerritoryGeometry) => TerritoryFillVisual
  renderMarker: (territory: TerritoryGeometry) => ReactNode
  /** Gestippelde zeeverbindingen (FO §4.3), tussen de gebieden- en de markerlaag. */
  seaRoutes?: SeaRouteSegment[]
  /**
   * Buitenstraal van een legerschijf incl. de halve ringdikte, in viewBox-eenheden (al
   * geschaald met de TV-tekstschaal). Zeeroutes stoppen daar, niet in het midden van de schijf.
   */
  markerRadius: number
  /** Bv. de claim-flare-ring op `TvClaimingScreen`, na de gebieds-/markerlagen. */
  extraOverlay?: ReactNode
}

/**
 * Gedeelde kaartlaag van de drie "bord"-schermen (`TvMainBoardScreen`,
 * `TvClaimingScreen`, `TvInitialPlacementScreen`): `GlassPanel` + zee-scrim + SVG met
 * ruwe-rand-filter (TO §7.2, 2026-08-07-migratie). Kleursemantiek/markers verschillen
 * per scherm (eigen/vijand vs. geclaimd/vrij) en blijven daarom render-props op de caller.
 */
export function TvBoardMap({
  geometry,
  filterId,
  getTerritoryVisual,
  renderMarker,
  seaRoutes = [],
  markerRadius,
  extraOverlay,
}: TvBoardMapProps) {
  // + de straal van één stip (ronde cap), zodat ook de eerste/laatste stip buiten de ring valt.
  const seaRouteInset = markerRadius + seaRoute.strokeWidth / 2

  return (
    <GlassPanel
      elevation="base"
      context="tv"
      padding="none"
      className="relative col-start-1 row-start-2 min-w-0 overflow-hidden"
    >
      <div className="absolute inset-0"/>
      <svg
        viewBox={`0 0 ${MAP_WIDTH_PX} ${MAP_HEIGHT_PX}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 my-auto"
      >
        <defs>
          <filter id={filterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={atlasRough.baseFrequency}
              numOctaves={atlasRough.numOctaves}
              seed={atlasRough.seed}
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale={atlasRough.scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          {geometry?.map((territory) => {
            const visual = getTerritoryVisual(territory)
            return (
              <path
                key={territory.id}
                d={territory.pathD}
                fill={visual.fillHex}
                fillOpacity={visual.fillOpacity}
                stroke={visual.strokeHex}
                strokeOpacity={visual.strokeOpacity}
                strokeWidth={visual.strokeWidth}
                strokeLinejoin="round"
                style={
                  visual.glowPx
                    ? { filter: `drop-shadow(0 0 ${visual.glowPx}px ${visual.glowColor ?? visual.fillHex})` }
                    : undefined
                }
              />
            )
          })}
        </g>

        {/* Buiten de ruwe-rand-filter: die zou de stippen vervormen tot vlekken. */}
        <g
          data-testid="sea-routes"
          stroke={seaRoute.color}
          strokeOpacity={seaRoute.opacity}
          strokeWidth={seaRoute.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`0 ${seaRoute.dotGap}`}
          fill="none"
        >
          {seaRoutes.map((segment) => {
            const trimmed = trimSeaRouteSegment(segment, seaRouteInset)
            if (!trimmed) return null

            return (
              <line key={trimmed.key} x1={trimmed.from.x} y1={trimmed.from.y} x2={trimmed.to.x} y2={trimmed.to.y} />
            )
          })}
        </g>

        {geometry?.map((territory) => renderMarker(territory))}

        {extraOverlay}
      </svg>
    </GlassPanel>
  )
}
