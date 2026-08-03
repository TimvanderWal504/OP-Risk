import { useTranslation } from 'react-i18next'
import { useTerritoryGeometry } from '../../../hooks/useTerritoryGeometry'
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from '../../../map/projection'
import { atlasRough, claimMarker } from '../../../map/boardVisualTokens'
import { boardTok, symbolGlyph } from '../../../design-reference/shared/design-tokens'
import { tvAnimations } from '../../../design-reference/shared/motion'
import { ColorSymbol } from '../../../components/ui/ColorSymbol'
import type { TvScreenProps } from './tvScreens'

const MAP_ID = 'standaard-43'

/**
 * TV tijdens `GamePhaseDto.Claiming` (Host-scherm.dc.html L184-254, `isClaim`, state-index 2).
 * `state.setupState.activePlayerId` is tijdens Claiming per constructie nooit `null`
 * (`GameProjection.Apply(TurnOrderDetermined)` stapt alleen bij `SetupMode.Claiming` naar
 * deze fase — bij `SetupMode.Random` gaat de state rechtstreeks naar `InitialPlacement`, deze
 * fase wordt dan nooit bereikt), dus geen defensieve null-branch nodig zoals bij
 * `TvInitialPlacementScreen`.
 *
 * 3-rijen grid (`96px_1fr_146px`), niet de letterlijke 2-rijen-vorm uit de export: anders
 * herberekent `boardScale.ts` de kaartviewport bij elke fase-overgang en springt de kaart
 * zichtbaar van formaat op een TV. De 146px-rij blijft leeg, zelfde scope-afspraak als het
 * ontbrekende spelerspaneel/de feed-strip op `TvMainBoardScreen`. Continent-labels, zee-scrim
 * en de onderrand-bijschriftbalk staan wél letterlijk in de export (L211-213, L231-233) maar
 * zijn hier bewust weggelaten, consistent met diezelfde bestaande omissie op `TvMainBoardScreen`
 * — gemelde bevinding, niet in deze taak opgelost.
 *
 * "Laatst geclaimd" komt uit het `TerritoryClaimed`-narratief-event (`useTvGame.tsx`,
 * `lastClaimedTerritoryId`), niet uit het vergelijken van twee `territories`-snapshots — zie
 * het bouwplan (Blocker 1) voor waarom.
 *
 * Read-only (FO §7.3/§2.3: de telefoon is de enige invoerbron) — geen `onClick` op de
 * gebiedslagen.
 */
export function TvClaimingScreen({ state, lastClaimedTerritoryId }: TvScreenProps) {
  // 'board' erbij voor `turnOf` (Host-scherm.dc.html:192) — dezelfde tekst als op het
  // Hoofdscherm, geen dubbele sleutel in twee namespaces (bouwplan Belangrijk 7).
  const { t } = useTranslation(['setupTv', 'board'])
  const { data: geometry } = useTerritoryGeometry()

  const activePlayerId = state.setupState?.activePlayerId
  const activePlayer = state.players.find((p) => p.id === activePlayerId)
  if (!activePlayer) return null

  const activeColor = state.colors.find((c) => c.id === activePlayer.colorId)
  const claimedCount = state.territories.filter((territory) => territory.ownerPlayerId !== null).length
  const totalCount = state.territories.length
  const flareTerritory = lastClaimedTerritoryId
    ? geometry?.find((territory) => territory.id === lastClaimedTerritoryId)
    : undefined

  return (
    <div className="absolute inset-0 grid grid-cols-[1fr_402px] grid-rows-[96px_1fr_146px] gap-4 gap-x-6.5 p-6 px-6.5">
      <div className="col-span-full flex items-center justify-between px-3.5">
        <div className="flex items-center gap-4.5">
          {activeColor && (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[16px] text-[34px]"
              style={{ background: activeColor.hex, color: activeColor.onHex, boxShadow: `0 0 24px ${activeColor.hex}99` }}
            >
              <ColorSymbol symbol={activeColor.symbol} />
            </div>
          )}
          <div>
            <div className="font-body text-[13px] font-extrabold uppercase tracking-[.16em] text-fg-muted">
              {t('board:turnOf')}
            </div>
            <div className="font-display text-[34px] font-black leading-none">
              {activePlayer.name}{' '}
              {activeColor && <span className="text-[24px] font-bold text-fg-muted">· {activeColor.name}</span>}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-pitch-700 bg-[color-mix(in_srgb,var(--pitch-400)_12%,transparent)] px-6.5 py-3 font-display text-[22px] font-black tracking-[.02em] text-pitch-300">
          {t('claimKicker')}
        </div>

        <div className="flex flex-col items-end">
          <span className="mb-1 font-body text-[13px] font-extrabold uppercase tracking-[.16em] text-fg-muted">
            {t('claimCounterLabel')}
          </span>
          <div className="rounded-xl border-2 border-border-strong px-5.5 py-1 font-display text-[56px] font-black leading-none tabular-nums text-fg">
            {claimedCount} / {totalCount}
          </div>
        </div>
      </div>

      <div
        className="relative col-start-1 row-start-2 min-w-0 overflow-hidden rounded-[14px] border border-[var(--atlas-map-border)] bg-[var(--atlas-map-bg)]"
        style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,.75), inset 0 0 0 3px rgba(120,96,56,.18)' }}
      >
        <img src={`/maps/${MAP_ID}/map-background.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <svg
          viewBox={`0 0 ${MAP_WIDTH_PX} ${MAP_HEIGHT_PX}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <filter id="atlasRoughC">
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

          <g filter="url(#atlasRoughC)">
            {geometry?.map((territory) => {
              const owned = state.territories.find((t) => t.territoryId === territory.id)
              const owner = state.players.find((p) => p.id === owned?.ownerPlayerId)
              const color = state.colors.find((c) => c.id === owner?.colorId)
              const claimed = owned?.ownerPlayerId != null
              const isFlare = territory.id === lastClaimedTerritoryId

              const fillHex = claimed ? (color?.hex ?? boardTok.neutral) : boardTok.neutral
              const fillOpacity = claimed ? boardTok.ownFill : boardTok.neuFill
              const strokeHex = isFlare ? boardTok.fg : claimed ? (color?.hex ?? boardTok.neutral) : boardTok.neutral
              const strokeOpacity = isFlare ? 1 : claimed ? boardTok.ownStroke : boardTok.neuStroke
              const strokeWidth = isFlare
                ? claimMarker.territorySwFlare
                : claimed
                  ? claimMarker.territorySwClaimed
                  : claimMarker.territorySwFree

              return (
                <path
                  key={territory.id}
                  d={territory.pathD}
                  fill={fillHex}
                  fillOpacity={fillOpacity}
                  stroke={strokeHex}
                  strokeOpacity={strokeOpacity}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                />
              )
            })}
          </g>

          {geometry?.map((territory) => {
            const owned = state.territories.find((t) => t.territoryId === territory.id)
            if (!owned?.ownerPlayerId) return null

            const owner = state.players.find((p) => p.id === owned.ownerPlayerId)
            const color = state.colors.find((c) => c.id === owner?.colorId)
            if (!color) return null

            return (
              <g key={territory.id}>
                <circle
                  cx={territory.centroidPx.x}
                  cy={territory.centroidPx.y}
                  r={claimMarker.discR}
                  fill={boardTok.disc}
                  fillOpacity={boardTok.discOp}
                  stroke={color.hex}
                  strokeWidth={claimMarker.ringSw}
                />
                <text
                  x={territory.centroidPx.x}
                  y={territory.centroidPx.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="Archivo, sans-serif"
                  fontWeight={700}
                  fontSize={claimMarker.symFontSize}
                  fill={color.onHex}
                >
                  {symbolGlyph[color.symbol as keyof typeof symbolGlyph] ?? ''}
                </text>
              </g>
            )
          })}

          {flareTerritory && (
            <circle
              cx={flareTerritory.centroidPx.x}
              cy={flareTerritory.centroidPx.y}
              r={claimMarker.flareR}
              fill="none"
              stroke={boardTok.fg}
              strokeWidth={claimMarker.flareSw}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: tvAnimations.burstShort,
              }}
            />
          )}
        </svg>
      </div>

      <div className="col-start-2 row-start-2 flex min-h-0 flex-col">
        <div className="mb-3 font-body text-[15px] font-extrabold uppercase tracking-[.14em] text-fg-muted">
          {t('claimPanelTitle')}
        </div>
        <div className="flex flex-col gap-3">
          {state.turnOrder.map((playerId) => {
            const player = state.players.find((p) => p.id === playerId)
            const color = state.colors.find((c) => c.id === player?.colorId)
            if (!player || !color) return null

            const count = state.territories.filter((t) => t.ownerPlayerId === playerId).length
            const isCurrent = playerId === activePlayerId

            return (
              <div
                key={playerId}
                className="relative flex items-center gap-4 overflow-hidden rounded-[14px] border p-3.5"
                style={{
                  background: isCurrent ? 'rgba(242,169,34,.10)' : 'var(--atlas-row)',
                  borderColor: isCurrent ? 'var(--gold-600)' : 'var(--border)',
                }}
              >
                {isCurrent && <div className="absolute inset-y-0 left-0 w-[5px] bg-gold-400" />}
                <div
                  className="flex h-13.5 w-13.5 flex-none items-center justify-center rounded-[13px] text-[28px]"
                  style={{ background: color.hex, color: color.onHex }}
                >
                  <ColorSymbol symbol={color.symbol} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-2xl font-extrabold leading-none">{player.name}</div>
                  <div className="mt-0.75 font-body text-[15px] text-fg-muted">{color.name}</div>
                </div>
                <div className="font-display text-[34px] font-black tabular-nums text-fg">{count}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
