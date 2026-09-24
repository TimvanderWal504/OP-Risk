import { useTranslation } from 'react-i18next'
import type { GameStateDto } from '../types/GameState'
import type { PlayerDto } from '../types/Player'
import { ColorAvatar } from './ui/ColorAvatar'
import { GlassPanel } from './ui/GlassPanel'
import { secondaryWashBg } from '../styles/glass-tokens'
import { tDynamic } from '../i18n/useT'

export interface GameInfoStandingsProps {
  state: GameStateDto
  me: PlayerDto
}

interface StandingRow {
  player: PlayerDto
  territories: number
  armies: number
  continents: { id: string; bonus: number }[]
}

/**
 * Tabblad "Stand" van spelinfo (FO §2.2 punt 3): per speler gebieden, legers, kaarten en de
 * continenten in bezit met bonus — alleen openbare informatie, nooit missies. Gebieden en legers
 * zijn weergave-optellingen over `state.territories` (zoals het TV-spelerspaneel); welk continent
 * van wie is, bepaalt de server (`state.continents`).
 *
 * Volgorde: nog meedoende spelers eerst, dan op gebieden, legers en beurtvolgorde — deterministisch,
 * zodat rijen niet verspringen bij gelijke stand. Uitgeschakelde spelers staan gedimd onderaan,
 * zoals op de TV.
 */
export function GameInfoStandings({ state, me }: GameInfoStandingsProps) {
  const { t } = useTranslation(['gameInfo', 'common'])

  const rows: StandingRow[] = state.players.map((player) => {
    const owned = state.territories.filter((territory) => territory.ownerPlayerId === player.id)

    return {
      player,
      territories: owned.length,
      armies: owned.reduce((sum, territory) => sum + territory.armyCount, 0),
      continents: state.continents
        .filter((continent) => continent.ownerPlayerId === player.id)
        .map(({ id, bonus }) => ({ id, bonus })),
    }
  })

  const turnIndex = (playerId: string) => state.turnOrder.indexOf(playerId)
  rows.sort(
    (a, b) =>
      Number(a.player.isEliminated) - Number(b.player.isEliminated) ||
      b.territories - a.territories ||
      b.armies - a.armies ||
      turnIndex(a.player.id) - turnIndex(b.player.id),
  )

  return (
    <div className="flex flex-col gap-2">
      {rows.map(({ player, territories, armies, continents }) => {
        const color = state.colors.find((c) => c.id === player.colorId)
        const isMe = player.id === me.id
        // Middle-dot-stat-regel, zelfde idioom als het TV-spelerspaneel; kaarten pas vanaf 1
        // (The Invisible Design Rule, zie DESIGN.md "Player Header / Stat rows").
        const stats = [
          t('standings.territories', { count: territories }),
          t('standings.armies', { count: armies }),
          ...(player.handCount > 0 ? [t('standings.cards', { count: player.handCount })] : []),
        ].join(' · ')

        return (
          <GlassPanel
            key={player.id}
            elevation="base"
            context="phone"
            padding="none"
            className="flex items-center gap-3 rounded-[14px] px-3.5 py-[11px]"
            style={{
              background: isMe ? secondaryWashBg : undefined,
              borderColor: isMe ? 'var(--secondary)' : 'var(--border)',
              opacity: player.isEliminated ? 0.5 : 1,
            }}
          >
            <ColorAvatar color={color} variant="row" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-h3 font-extrabold text-fg">
                {player.name}{' '}
                {isMe && <span className="text-xs text-pitch-300">{`(${t('standings.you')})`}</span>}
              </div>
              <div className="font-body text-sm text-fg-secondary tabular-nums">
                {player.isEliminated ? t('common:playerHeader.eliminated') : stats}
              </div>
              {continents.length > 0 && (
                <div className="font-body text-xs text-fg-muted">
                  {continents
                    .map(({ id, bonus }) =>
                      t('standings.continent', { continent: tDynamic(id, 'continents'), bonus }),
                    )
                    .join(' · ')}
                </div>
              )}
            </div>
          </GlassPanel>
        )
      })}
    </div>
  )
}
