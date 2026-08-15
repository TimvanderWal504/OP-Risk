import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tDynamic } from '../../../i18n/useT'
import { TurnStatusHeader } from '../../../components/board/TurnStatusHeader'
import { TvBoardMap } from '../../../components/board/TvBoardMap'
import { useTerritoryGeometry } from '../../../hooks/useTerritoryGeometry'
import { useTerritoryOwnership } from '../../../hooks/useTerritoryOwnership'
import { marker, territoryGlow, territoryStroke } from '../../../map/boardVisualTokens'
import { boardTok } from '../../../styles/design-tokens'
import { tvAnimations } from '../../../styles/motion'
import { ColorSymbol } from '../../../components/ui/ColorSymbol'
import { GlassPanel } from '../../../components/ui/GlassPanel'
import type { TvScreenProps } from './tvScreens'

/**
 * TV-hoofdbord tijdens `GamePhaseDto.InProgress`. Read-only weergave (FO §7.3/§2.3: de telefoon
 * is de enige invoerbron) — geen `onClick` op de gebiedslagen. Selectie-/gevechtsringen horen
 * bij Attack en zijn hier bewust niet gebouwd; idem de gebeurtenis-feed — blijft buiten scope
 * tot er een server-databron voor is.
 *
 * Zijpaneel (spelerslijst): zelfde `GlassPanel`-patroon als `TvClaimingScreen`, met
 * territorium- én legertotaal per speler (`state.territories` is al client-side beschikbaar).
 */
export function TvMainBoardScreen({ state }: TvScreenProps) {
  const { t } = useTranslation('board')
  const { data: geometry } = useTerritoryGeometry()
  const ownership = useTerritoryOwnership(state.territories, state.players, state.colors)

  // Legeraantal van de vórige render, om per gebied de telrichting (op/neer) te bepalen voor de
  // A1-teldemo-animatie. Bijgewerkt tijdens render (niet via een ref of effect,
  // react-hooks/refs staat geen ref-mutatie tijdens render toe): zelfde "vergelijk en pas
  // aan"-patroon als `useHeldPhase.ts`.
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

  const turnState = state.turnState
  const activePlayer = state.players.find((p) => p.id === turnState?.activePlayerId)
  if (!turnState || !activePlayer) return null

  const activeColor = state.colors.find((c) => c.id === activePlayer.colorId)

  const territoryCountByPlayer: Record<string, number> = {}
  const armyTotalByPlayer: Record<string, number> = {}
  state.territories.forEach((territory) => {
    if (!territory.ownerPlayerId) return
    territoryCountByPlayer[territory.ownerPlayerId] = (territoryCountByPlayer[territory.ownerPlayerId] ?? 0) + 1
    armyTotalByPlayer[territory.ownerPlayerId] = (armyTotalByPlayer[territory.ownerPlayerId] ?? 0) + territory.armyCount
  })

  return (
    <div className="absolute inset-0 grid grid-cols-[1fr_402px] grid-rows-[96px_1fr_146px] gap-4 gap-x-6.5 p-6 px-6.5">
      <TurnStatusHeader
        activePlayer={activePlayer}
        activeColor={activeColor}
        turnPhase={turnState.turnPhase}
        timer={turnState.timer}
      />

      <TvBoardMap
        geometry={geometry}
        filterId="atlasRough"
        getTerritoryVisual={(territory) => {
          const entry = ownership.get(territory.id)
          const owner = entry?.owner
          const color = entry?.color
          const isOwn = owner?.id === activePlayer.id
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
          // De derde ringSw-tak (1.75) hoort bij de nog niet gebouwde selectiestaat.
          const ringSw = owner?.id === activePlayer.id ? marker.ringSwOwn : marker.ringSwEnemy

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

      <GlassPanel elevation="base" context="tv" className="col-start-2 row-start-2 flex min-h-0 flex-col">
        <div className="mb-3 font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted">
          {t('playersTitle')}
        </div>
        <div className="flex flex-col gap-3">
          {state.turnOrder.map((playerId) => {
            const player = state.players.find((p) => p.id === playerId)
            const color = state.colors.find((c) => c.id === player?.colorId)
            if (!player || !color) return null

            const isCurrent = playerId === activePlayer.id

            return (
              <div
                key={playerId}
                className="relative flex items-center gap-4 overflow-hidden rounded-[14px] border p-3.5"
                style={{
                  background: isCurrent ? 'color-mix(in srgb, var(--color-silver-400) 10%, transparent)' : 'var(--atlas-row)',
                  borderColor: isCurrent ? 'var(--color-silver-600)' : 'var(--border)',
                  opacity: player.isEliminated ? 0.5 : 1,
                }}
              >
                {isCurrent && <div className="absolute inset-y-0 left-0 w-[5px] bg-silver-400" />}
                <div
                  className="flex h-13.5 w-13.5 flex-none items-center justify-center rounded-[13px] text-[28px]"
                  style={{ background: color.hex, color: color.onHex }}
                >
                  <ColorSymbol symbol={color.symbol} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-2xl font-extrabold leading-none">{player.name}</div>
                  <div className="mt-0.75 font-body text-body text-fg-secondary">
                    {t('territoriesCount', { count: territoryCountByPlayer[playerId] ?? 0 })}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-display text-[34px] font-black tabular-nums text-fg">
                    {armyTotalByPlayer[playerId] ?? 0}
                  </div>
                  <div className="font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted">
                    {t('armiesLabel')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </GlassPanel>
    </div>
  )
}
