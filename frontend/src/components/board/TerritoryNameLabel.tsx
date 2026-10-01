import type { TerritoryGeometry } from '../../map/loadTerritoryGeometry'
import type { scaledMarker } from '../../map/boardVisualTokens'
import { boardTok, fontFamily } from '../../styles/design-tokens'
import { tDynamic } from '../../i18n/useT'

export interface TerritoryNameLabelProps {
  territory: TerritoryGeometry
  /** De legermarker-maten van het scherm, al geschaald met de TV-tekstschaal. */
  marker: ReturnType<typeof scaledMarker>
}

/**
 * De gebiedsnaam onder de legerschijf (Main Board, startopstelling). Hoort in de `renderLabel`-laag
 * van `TvBoardMap`, onder álle schijven: een naam die over de schijf van een buurgebied valt,
 * verdwijnt daar dan onder in plaats van het legergetal te bedekken (besluit gebruiker 2026-10-01).
 */
export function TerritoryNameLabel({ territory, marker }: TerritoryNameLabelProps) {
  return (
    <text
      x={territory.centroidPx.x}
      y={territory.centroidPx.y + marker.nameOffsetY}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily={fontFamily.display}
      fontWeight={700}
      fontSize={marker.nameFontSize}
      fill={boardTok.numFg}
      stroke={boardTok.disc}
      strokeWidth={marker.nameStrokeWidth}
      strokeOpacity={marker.nameStrokeOpacity}
      strokeLinejoin="round"
      style={{ paintOrder: 'stroke', letterSpacing: '.01em' }}
    >
      {tDynamic(territory.id, 'territories')}
    </text>
  )
}
