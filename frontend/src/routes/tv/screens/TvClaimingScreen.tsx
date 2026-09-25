import { useTranslation } from 'react-i18next'
import { useTerritoryGeometry } from '../../../hooks/useTerritoryGeometry'
import { useTerritoryOwnership } from '../../../hooks/useTerritoryOwnership'
import { scaledClaimMarker, territoryGlow } from '../../../map/boardVisualTokens'
import { useTvDisplayScale } from '../../../hooks/useTvDisplayScale'
import { boardTok, symbolGlyph } from '../../../styles/design-tokens'
import { tvAnimations } from '../../../styles/motion'
import { Badge } from '../../../components/ui/Badge'
import { ColorSymbol } from '../../../components/ui/ColorSymbol'
import { InstructionKicker } from '../../../components/ui/InstructionKicker'
import { GlassPanel } from '../../../components/ui/GlassPanel'
import { TvBoardMap } from '../../../components/board/TvBoardMap'
import { tDynamic } from '../../../i18n/useT'
import type { TvScreenProps } from './tvScreens'
import { ActionTicker } from '../../../components/ActionTicker'

/**
 * TV tijdens `GamePhaseDto.Claiming`. `state.setupState.activePlayerId` is tijdens Claiming per
 * constructie nooit `null` (`GameProjection.Apply(TurnOrderDetermined)` stapt alleen bij
 * `SetupMode.Claiming` naar deze fase — bij `SetupMode.Random` gaat de state rechtstreeks naar
 * `InitialPlacement`, deze fase wordt dan nooit bereikt), dus geen defensieve null-branch nodig
 * zoals bij `TvInitialPlacementScreen`.
 *
 * 3-rijen grid (`96px_1fr_146px`): anders herberekent `boardScale.ts` de kaartviewport bij elke
 * fase-overgang en springt de kaart zichtbaar van formaat op een TV. De 146px-rij (feed-strip)
 * blijft leeg — zelfde scope-afspraak als op `TvMainBoardScreen`, die evenmin een server-databron
 * heeft (geen log/event-DTO). Het rechterspelerspaneel zelf bestáát wel (`col-start-2`
 * hieronder, gelijk aan `TvMainBoardScreen`), inclusief de rol-badge sinds plan-rollen taak 6 —
 * frontend/CLAUDE.md's afwijkingenlijst noemde dit paneel eerder ten onrechte samen met de
 * feed-strip als ontbrekend, gecorrigeerd in dezelfde taak (bevinding 2). Continent-labels,
 * zee-scrim en de onderrand-bijschriftbalk zijn hier bewust weggelaten, consistent met diezelfde
 * bestaande omissie op `TvMainBoardScreen` — gemelde bevinding, niet in deze taak opgelost.
 *
 * "Laatst geclaimd" komt uit het `TerritoryClaimed`-narratief-event (`useTvGame.tsx`,
 * `lastClaimedTerritoryId`), niet uit het vergelijken van twee `territories`-snapshots — zie
 * het bouwplan (Blocker 1) voor waarom.
 *
 * Read-only (FO §7.3/§2.3: de telefoon is de enige invoerbron) — geen `onClick` op de
 * gebiedslagen.
 */
export function TvClaimingScreen({ state, lastClaimedTerritoryId }: TvScreenProps) {
  // 'board' erbij voor `turnOf` — dezelfde tekst als op het Hoofdscherm, geen dubbele sleutel
  // in twee namespaces (bouwplan Belangrijk 7).
  const { t } = useTranslation(['setupTv', 'board'])
  const { data: geometry } = useTerritoryGeometry()
  const ownership = useTerritoryOwnership(state.territories, state.players, state.colors)
  // Claim-markers (schijf, symbool, flare) schalen mee met de TV-tekstschaal (plan-testronde-tv punt 2).
  const claimMarker = scaledClaimMarker(useTvDisplayScale().text)

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
      <GlassPanel elevation="base" context="tv" padding="none" className="col-span-full flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-4.5">
          {activeColor && (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[16px] text-size8"
              style={{ background: activeColor.hex, color: activeColor.onHex, boxShadow: `0 0 24px ${activeColor.hex}99` }}
            >
              <ColorSymbol symbol={activeColor.symbol} />
            </div>
          )}
          <div className="font-display text-size8 font-black leading-none">
            {/* Dubbele punt, zelfde grammaticafix als TurnStatusHeader/ActivePlayerBanner. */}
            {t('board:turnOf')}: {activePlayer.name}{' '}
            {activeColor && <span className="text-size5 font-bold text-fg-muted">· {activeColor.name}</span>}
          </div>
        </div>

        <InstructionKicker>{t('claimKicker')}</InstructionKicker>

        <div className="flex flex-col items-end">
          <span className="mb-1 font-body text-label font-extrabold uppercase tracking-[.1em] text-fg-muted">
            {t('claimCounterLabel')}
          </span>
          <div className="rounded-xl border-2 border-border-strong px-5.5 py-1 font-display text-size11 font-black leading-none tabular-nums text-fg">
            {claimedCount} / {totalCount}
          </div>
        </div>
      </GlassPanel>

      <TvBoardMap
        geometry={geometry}
        filterId="atlasRoughC"
        getTerritoryVisual={(territory) => {
          const entry = ownership.get(territory.id)
          const owned = entry?.owned
          const color = entry?.color
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
          const glowPx = claimed && color ? territoryGlow.claimed : undefined

          return { fillHex, fillOpacity, strokeHex, strokeOpacity, strokeWidth, glowPx, glowColor: color?.hex }
        }}
        renderMarker={(territory) => {
          const entry = ownership.get(territory.id)
          const owned = entry?.owned
          if (!owned?.ownerPlayerId) return null

          const color = entry?.color
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
        }}
        extraOverlay={
          flareTerritory && (
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
          )
        }
      />

      <GlassPanel elevation="base" context="tv" className="col-start-2 row-start-2 flex min-h-0 flex-col">
        <div className="mb-3 font-body text-label font-extrabold uppercase tracking-[.1em] text-fg-muted">
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
                  background: isCurrent ? 'color-mix(in srgb, var(--color-silver-400) 10%, transparent)' : 'var(--atlas-row)',
                  borderColor: isCurrent ? 'var(--color-silver-600)' : 'var(--border)',
                }}
              >
                {isCurrent && <div className="absolute inset-y-0 left-0 w-[5px] bg-silver-400" />}
                <div
                  className="flex h-13.5 w-13.5 flex-none items-center justify-center rounded-[13px] text-h1"
                  style={{ background: color.hex, color: color.onHex }}
                >
                  <ColorSymbol symbol={color.symbol} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-display text-size5 font-extrabold leading-none">
                    {player.name}
                    {/* Rol-badge (plan-rollen B3/C4, DESIGN.md § Role Badge) — zelfde behandeling,
                        inclusief de "geen span om de naam"-reden, als de tegenhanger op
                        TvMainBoardScreen. */}
                    {player.roleId && (
                      <Badge tone={player.isRoleActive ? 'pitch-solid' : 'silver-outline'}>
                        {tDynamic(`${player.roleId}.name`, 'roles')}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.75 font-body text-body text-fg-secondary">{color.name}</div>
                </div>
                <div className="font-display text-size8 font-black tabular-nums text-fg">{count}</div>
              </div>
            )
          })}
        </div>
      </GlassPanel>

      <ActionTicker state={state} className="col-start-1 row-start-3" />
    </div>
  )
}
