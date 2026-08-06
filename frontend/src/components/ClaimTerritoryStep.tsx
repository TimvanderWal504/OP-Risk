import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto, TerritoryDto } from '../types/GameState'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import { ColorAvatar } from './ui/ColorAvatar'
import { ActivePlayerBanner } from './ui/ActivePlayerBanner'
import { StatHeaderCard } from './ui/StatHeaderCard'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import { tDynamic } from '../i18n/useT'

export interface ClaimTerritoryStepProps {
  territories: TerritoryDto[]
  territoryCatalog: TerritoryCatalogDto[]
  players: PlayerDto[]
  colors: PlayerColorDto[]
  activePlayerId: string
  playerId: string
  /**
   * De gebieden die déze speler mag claimen, aangeleverd door de server (vrij én niet zijn
   * eigen rol-herkomstland, FO §8.1). Bewust geen eigen filter op `territories`: welke keuzes
   * geldig zijn is een spelregel, en die hoort niet in de client.
   */
  claimableTerritoryIds: string[]
  onClaim: (territoryId: string) => void
  error?: string | null
}

/**
 * Startopstelling · Claimen (`isClaim`-fase in het oorspronkelijke design). Twee substaten uit het
 * design: `claimMine` (jouw beurt — per-continent gegroepeerde knoppenlijst + bevestigen) en
 * `claimMineNot` (niet jouw beurt — wie heeft al hoeveel geclaimd). Substaat volgt uit
 * `activePlayerId === playerId`, niet uit lokale state.
 *
 * Afwijking: de `claimSimRound`-knop ("Volgende ronde (demo)", L445) is designdemo-only —
 * simuleert andere spelers lokaal zonder server. Bestaat hier niet: de server drijft de
 * voortgang, geen client-side simulatie (frontend/CLAUDE.md).
 */
export function ClaimTerritoryStep({
  territories,
  territoryCatalog,
  players,
  colors,
  activePlayerId,
  playerId,
  claimableTerritoryIds,
  onClaim,
  error = null,
}: ClaimTerritoryStepProps) {
  const { t } = useTranslation('setup')
  const [pendingTerritoryId, setPendingTerritoryId] = useState<string | null>(null)
  const isMyTurn = activePlayerId === playerId

  // Hoeveel er nog onverdeeld zijn is een feit uit de state (de teller in de kop); wélke daarvan
  // deze speler mag kiezen komt van de server.
  const claimFree = territories.filter((territory) => !territory.ownerPlayerId).length

  if (isMyTurn) {
    const continentOf = (territoryId: string) =>
      territoryCatalog.find((entry) => entry.id === territoryId)?.continent ?? null

    const groups = Array.from(
      new Set(claimableTerritoryIds.map(continentOf).filter((c): c is string => c !== null)),
    ).map((continent) => ({
      continent,
      territoryIds: claimableTerritoryIds.filter((territoryId) => continentOf(territoryId) === continent),
    }))

    return (
      <div className="flex flex-1 flex-col min-h-0 p-4">
        <StatHeaderCard
          title={t('claim.title')}
          statValue={claimFree}
          statLabel={t('claim.left')}
          paddingY={11}
        />
        <div className="mt-[11px] mb-2 font-body text-sm text-fg-muted">{t('claim.sub')}</div>
        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.continent}>
              <div className="mx-0.5 mb-[7px] font-body text-xs font-extrabold tracking-[.1em] text-fg-muted uppercase">
                {tDynamic(group.continent, 'continents')}
              </div>
              <div className="flex flex-col gap-2">
                {group.territoryIds.map((territoryId) => {
                  const selected = pendingTerritoryId === territoryId

                  return (
                    <button
                      key={territoryId}
                      type="button"
                      onClick={() => setPendingTerritoryId(territoryId)}
                      className="flex min-h-[58px] w-full items-center gap-3 rounded-[14px] border-2 px-3.5 text-left text-fg"
                      style={{
                        background: selected ? 'rgba(156,176,202,.14)' : 'var(--atlas-t04)',
                        borderColor: selected ? 'var(--silver-400)' : 'var(--border)',
                      }}
                    >
                      <span className="flex-1 font-display text-h3 font-extrabold">
                        {tDynamic(territoryId, 'territories')}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <Footer error={error}>
          {pendingTerritoryId ? (
            <Button
              onClick={() => {
                onClaim(pendingTerritoryId)
                setPendingTerritoryId(null)
              }}
            >
              {`${t('claim.confirm')} ${tDynamic(pendingTerritoryId, 'territories')}`}
            </Button>
          ) : (
            <div className="flex min-h-16 items-center justify-center rounded-card border border-dashed border-border-strong text-sm text-fg-muted">
              {t('claim.pickFirst')}
            </div>
          )}
        </Footer>
      </div>
    )
  }

  const activePlayer = players.find((player) => player.id === activePlayerId)
  const activeColor = colors.find((color) => color.id === activePlayer?.colorId)

  const claimBoard = players.map((player) => {
    const color = colors.find((c) => c.id === player.colorId)

    return {
      player,
      color,
      count: territories.filter((territory) => territory.ownerPlayerId === player.id).length,
      isMe: player.id === playerId,
    }
  })

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4">
      <ActivePlayerBanner
        turnOfLabel={t('idle.nowPlaying')}
        playerName={activePlayer?.name ?? ''}
        color={activeColor}
        subtitle={t('claim.confirm')}
        stat={{ value: claimFree, label: t('claim.left') }}
      />
      <div className="mt-4 mb-2 font-body text-xs font-extrabold tracking-[.12em] text-fg-muted uppercase">
        {t('claim.claimedBy')}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {claimBoard.map(({ player, color, count, isMe }) => (
          <div
            key={player.id}
            className="flex items-center gap-3 rounded-[14px] border px-3.5 py-[11px]"
            style={{
              background: isMe ? 'rgba(33,92,156,.16)' : 'var(--atlas-t03)',
              borderColor: isMe ? 'var(--secondary)' : 'var(--border)',
            }}
          >
            <ColorAvatar color={color} variant="row" />
            <span className="flex-1 font-display text-h3 font-extrabold">
              {player.name} {isMe && <span className="text-xs text-pitch-300">{`(${t('claim.you')})`}</span>}
            </span>
            <span className="font-display text-h2 font-black tabular-nums">{count}</span>
            <span className="font-body text-xs text-fg-muted">{t('claim.colTerr')}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 mb-3 text-center font-body text-sm text-fg-muted">
        {t('claim.yourTurnSoon')}
      </div>
    </div>
  )
}
