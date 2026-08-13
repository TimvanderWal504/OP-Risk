import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tDynamic } from '../../../i18n/useT'
import { useTerritoryGeometry } from '../../../hooks/useTerritoryGeometry'
import { useTerritoryOwnership } from '../../../hooks/useTerritoryOwnership'
import { marker, territoryGlow, territoryStroke } from '../../../map/boardVisualTokens'
import { boardTok } from '../../../styles/design-tokens'
import { tvAnimations } from '../../../styles/motion'
import { ColorSymbol } from '../../../components/ui/ColorSymbol'
import { InstructionKicker } from '../../../components/ui/InstructionKicker'
import { GlassPanel } from '../../../components/ui/GlassPanel'
import { TvBoardMap } from '../../../components/board/TvBoardMap'
import type { TvScreenProps } from './tvScreens'

/**
 * TV tijdens `GamePhaseDto.InitialPlacement` (FO §5.1). Geen letterlijke exportsectie —
 * bevestigde bevinding (de TV-`states`-lijst in het oorspronkelijke design kende geen aparte staat
 * voor deze fase), afgestemd met de gebruiker: hergebruikt het Hoofdscherm-grid-patroon van
 * `TvMainBoardScreen.tsx`, 3-rijen grid, geen rechterpaneel/feed-strip (zelfde scope-afspraak
 * als daar).
 *
 * `state.setupState.activePlayerId` kan hier, anders dan bij `TvClaimingScreen`, wél `null`
 * zijn (`SetupMode.Random`: iedereen plaatst gelijktijdig, geen actieve speler — TO/FO §5.1).
 * Topbar en kaartkleuring hebben dus elk twee paden: met een actieve speler (SetupMode.Claiming,
 * beurt-gebaseerd) gedraagt dit scherm zich als `TvMainBoardScreen`; zonder actieve speler is er
 * geen zinvol eigen/vijand-perspectief, dus toont elk gebied zijn eigen kleur op volle
 * `own`-opaciteit in plaats van een gedimde "iedereen is vijand"-weergave (geen exportwaarde,
 * bewuste designkeuze — zie de afwijkingenlijst).
 *
 * Read-only (FO §7.3/§2.3) — geen `onClick` op de gebiedslagen.
 */
export function TvInitialPlacementScreen({ state }: TvScreenProps) {
  // 'board' erbij voor `turnOf`, zelfde hergebruik als TvClaimingScreen.
  const { t } = useTranslation(['setupTv', 'board'])
  const { data: geometry } = useTerritoryGeometry()
  const ownership = useTerritoryOwnership(state.territories, state.players, state.colors)

  // Zelfde "vergelijk en pas aan tijdens render"-patroon als TvMainBoardScreen, voor de
  // telrichting van de A1-teldemo-animatie — een lokaal presentatiedetail over een getal dat
  // al in `state.territories` zit, geen afgeleid gebeurtenis-feit (in tegenstelling tot de
  // claim-flare op `TvClaimingScreen`, zie het bouwplan Blocker 1).
  const [prevArmy, setPrevArmy] = useState<Record<string, number>>({})
  const currentArmy: Record<string, number> = {}
  state.territories.forEach((territory) => {
    currentArmy[territory.territoryId] = territory.armyCount
  })
  const armyChanged =
    Object.keys(currentArmy).length !== Object.keys(prevArmy).length ||
    Object.entries(currentArmy).some(([territoryId, armyCount]) => prevArmy[territoryId] !== armyCount)
  if (armyChanged) {
    setPrevArmy(currentArmy)
  }

  if (!state.setupState) return null

  const activePlayerId = state.setupState.activePlayerId
  const activePlayer = activePlayerId ? state.players.find((p) => p.id === activePlayerId) : undefined
  const activeColor = activePlayer ? state.colors.find((c) => c.id === activePlayer.colorId) : undefined

  return (
    <div className="absolute inset-0 grid grid-cols-[1fr_402px] grid-rows-[96px_1fr_146px] gap-4 gap-x-6.5 p-6 px-6.5">
      <GlassPanel elevation="base" context="tv" padding="none" className="col-span-full flex items-center justify-between px-3.5 py-3">
        {activePlayer && activeColor ? (
          <div className="flex items-center gap-4.5">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[16px] text-[34px]"
              style={{ background: activeColor.hex, color: activeColor.onHex, boxShadow: `0 0 24px ${activeColor.hex}99` }}
            >
              <ColorSymbol symbol={activeColor.symbol} />
            </div>
            <div className="font-display text-[34px] font-black leading-none">
              {/* Dubbele punt, zelfde grammaticafix als TurnStatusHeader/ActivePlayerBanner. */}
              {t('board:turnOf')}: {activePlayer.name}{' '}
              <span className="text-[24px] font-bold text-fg-muted">· {activeColor.name}</span>
            </div>
          </div>
        ) : (
          <div className="font-display text-[34px] font-black leading-none">{t('placeEveryoneAtOnce')}</div>
        )}

        <InstructionKicker>{t('placeTitle')}</InstructionKicker>
      </GlassPanel>

      <TvBoardMap
        geometry={geometry}
        filterId="atlasRough"
        getTerritoryVisual={(territory) => {
          const entry = ownership.get(territory.id)
          const owner = entry?.owner
          const color = entry?.color
          // Zonder actieve speler (SetupMode.Random) is er geen eigen/vijand-perspectief:
          // elk geclaimd gebied krijgt zijn eigen kleur op volle `own`-opaciteit (bouwplan
          // Belangrijk 8), niet de gedimde `enemy`-stijl. Mét actieve speler (SetupMode.
          // Claiming) geldt het gewone eigen/vijand-onderscheid, zoals op het Hoofdscherm.
          const isOwn = !activePlayer || owner?.id === activePlayer.id
          const fillHex = color?.hex ?? boardTok.neutral
          const fillOpacity = color ? (isOwn ? boardTok.ownFill : boardTok.enFill) : boardTok.neuFill
          const strokeOpacity = color ? (isOwn ? boardTok.ownStroke : boardTok.enStroke) : boardTok.neuStroke
          const strokeWidth = color ? (isOwn ? territoryStroke.own : territoryStroke.enemy) : territoryStroke.neutral
          const glowPx = color ? (isOwn ? territoryGlow.own : territoryGlow.enemy) : undefined

          return { fillHex, fillOpacity, strokeHex: fillHex, strokeOpacity, strokeWidth, glowPx }
        }}
        renderMarker={(territory) => {
          const entry = ownership.get(territory.id)
          const owned = entry?.owned
          if (!owned) return null

          const owner = entry?.owner
          const color = entry?.color
          const ringColor = color?.hex ?? boardTok.neutral
          const isOwn = !activePlayer || owner?.id === activePlayer.id
          const ringSw = isOwn ? marker.ringSwOwn : marker.ringSwEnemy

          const wasArmy = prevArmy[territory.id]
          const dir = wasArmy !== undefined && wasArmy !== owned.armyCount ? (owned.armyCount > wasArmy ? 1 : -1) : 0

          return (
            <g key={territory.id}>
              <circle
                cx={territory.centroidPx.x}
                cy={territory.centroidPx.y}
                r={marker.discR}
                fill={boardTok.disc}
                fillOpacity={boardTok.discOp}
                stroke={ringColor}
                strokeWidth={ringSw}
              />
              <text
                x={territory.centroidPx.x}
                y={territory.centroidPx.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Archivo, sans-serif"
                fontWeight={700}
                fontSize={marker.armyFontSize}
                fill={boardTok.numFg}
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: dir !== 0 ? tvAnimations.countTick(dir) : 'none',
                }}
              >
                {owned.armyCount}
              </text>
              <text
                x={territory.centroidPx.x}
                y={territory.centroidPx.y + marker.nameOffsetY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Archivo, sans-serif"
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
            </g>
          )
        }}
      />
    </div>
  )
}
