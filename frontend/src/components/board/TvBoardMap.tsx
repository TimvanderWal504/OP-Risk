import type { ReactNode } from 'react'
import type { TerritoryGeometry } from '../../map/loadTerritoryGeometry'
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from '../../map/projection'
import { atlasRough } from '../../map/boardVisualTokens'
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
  /** Bv. de claim-flare-ring op `TvClaimingScreen`, na de gebieds-/markerlagen. */
  extraOverlay?: ReactNode
}

/**
 * Gedeelde kaartlaag van de drie "bord"-schermen (`TvMainBoardScreen`,
 * `TvClaimingScreen`, `TvInitialPlacementScreen`): `GlassPanel` + zee-scrim + SVG met
 * ruwe-rand-filter (TO §7.2, 2026-08-07-migratie). Kleursemantiek/markers verschillen
 * per scherm (eigen/vijand vs. geclaimd/vrij) en blijven daarom render-props op de caller.
 */
export function TvBoardMap({ geometry, filterId, getTerritoryVisual, renderMarker, extraOverlay }: TvBoardMapProps) {
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

        {geometry?.map((territory) => renderMarker(territory))}

        {extraOverlay}
      </svg>
    </GlassPanel>
  )
}
