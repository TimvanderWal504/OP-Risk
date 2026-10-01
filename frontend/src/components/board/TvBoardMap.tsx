import type { ReactNode } from 'react'
import type { TerritoryGeometry } from '../../map/loadTerritoryGeometry'
import { MAP_HEIGHT_PX, MAP_WIDTH_PX, project } from '../../map/projection'
import { atlasRough, lockedHatch, seaRoute } from '../../map/boardVisualTokens'
import { trimSeaRouteSegment, type SeaRouteSegment } from '../../map/seaRoutes'
import { GlassPanel } from '../ui/GlassPanel'
import { eventRoundTok } from '../../styles/design-tokens'

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
  /**
   * Gebiedsnamen, in een eigen laag ónder alle markers: een naam die over de schijf van een
   * buurgebied valt, verdwijnt eronder in plaats van het legergetal te bedekken.
   */
  renderLabel?: (territory: TerritoryGeometry) => ReactNode
  /** Gestippelde zeeverbindingen (FO §4.3), tussen de gebieden- en de markerlaag. */
  seaRoutes?: SeaRouteSegment[]
  /**
   * Buitenstraal van een legerschijf incl. de halve ringdikte, in viewBox-eenheden (al
   * geschaald met de TV-tekstschaal). Zeeroutes stoppen daar, niet in het midden van de schijf.
   */
  markerRadius: number
  /** Bv. de claim-flare-ring op `TvClaimingScreen`, na de gebieds-/markerlagen. */
  extraOverlay?: ReactNode
  /**
   * Gebieden die een lopend effect afsluit (FO §9.2, `TerritoryLocked`) — door de server bepaald.
   * Krijgen een statische arcering over de vulling (DESIGN.md § Event Round).
   */
  lockedTerritoryIds?: ReadonlySet<string>
  /**
   * Onderaan over de kaart, gecentreerd onder zuidelijk Afrika, buiten de SVG — de actief-effect-chip
   * (DESIGN.md § Event Round).
   */
  belowAfrica?: ReactNode
}

/**
 * Horizontale plek van `belowAfrica`, als fractie van de paneelbreedte. Klopt exact zolang de kaart
 * de breedte van het paneel vult (`meet` begrensd door de breedte), wat het TV-raster altijd geeft;
 * bij een smaller paneel schuift de chip hooguit iets naar het midden.
 */
const BELOW_AFRICA_LEFT = `${(project(eventRoundTok.effectChipAnchorLon, 0).x / MAP_WIDTH_PX) * 100}%`

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
  renderLabel,
  seaRoutes = [],
  markerRadius,
  extraOverlay,
  lockedTerritoryIds,
  belowAfrica,
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
      {belowAfrica && (
        <div className="absolute bottom-4 z-10 -translate-x-1/2" style={{ left: BELOW_AFRICA_LEFT }}>
          {belowAfrica}
        </div>
      )}
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
          <pattern
            id={`${filterId}-locked-hatch`}
            patternUnits="userSpaceOnUse"
            width={lockedHatch.gap}
            height={lockedHatch.gap}
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={lockedHatch.gap} stroke={lockedHatch.color} strokeWidth={lockedHatch.strokeWidth} />
          </pattern>
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

        {/* Afgesloten gebieden: statische arcering boven de vulling, buiten de ruwe-rand-filter
            (die zou de lijnen vervormen), onder routes en markers. */}
        {lockedTerritoryIds && lockedTerritoryIds.size > 0 && (
          <g data-testid="locked-territories" fillOpacity={lockedHatch.opacity} stroke="none">
            {geometry
              ?.filter((territory) => lockedTerritoryIds.has(territory.id))
              .map((territory) => (
                <path key={territory.id} d={territory.pathD} fill={`url(#${filterId}-locked-hatch)`} />
              ))}
          </g>
        )}

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

        {renderLabel && <g data-testid="territory-labels">{geometry?.map((territory) => renderLabel(territory))}</g>}

        {geometry?.map((territory) => renderMarker(territory))}

        {extraOverlay}
      </svg>
    </GlassPanel>
  )
}
