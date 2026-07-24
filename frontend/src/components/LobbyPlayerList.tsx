import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto, RoleSummaryDto } from '../types/GameState'
import { PlayerAvatar } from './ui/PlayerAvatar'

export interface LobbyPlayerListProps {
  players: PlayerDto[]
  colors: PlayerColorDto[]
  roles: RoleSummaryDto[]
  maxPlayers: number
}

/** Spelerskaarten + wacht-slots (TV, FO §2.1). */
export function LobbyPlayerList({ players, colors, roles, maxPlayers }: LobbyPlayerListProps) {
  const emptySlots = Math.max(0, maxPlayers - players.length)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="twc-eyebrow">Spelers</span>
        <span className="font-display text-h2 font-black text-pitch-400">
          {players.length} / {maxPlayers}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {players.map((player) => {
          const color = colors.find((c) => c.id === player.colorId)
          const role = roles.find((r) => r.id === player.roleId)

          return (
            <div
              key={player.id}
              className="flex items-center gap-4 rounded-card border border-border bg-white/3 p-4"
            >
              <PlayerAvatar colorHex={color?.hex} colorSymbol={color?.symbol} isHost={player.isHost} />
              <div className="min-w-0">
                <div className="truncate font-display text-h2 font-bold">{player.name}</div>
                <div className="truncate text-sm text-fg-muted">
                  {color?.name ?? 'Nog geen kleur'}
                  {role ? ` · ${role.name}` : ''}
                </div>
              </div>
            </div>
          )
        })}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="flex items-center gap-4 rounded-card border-2 border-dashed border-border-strong p-4 opacity-60"
          >
            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border-2 border-dashed border-fg-muted text-2xl text-fg-muted">
              +
            </div>
            <div className="text-fg-muted">Wachten op speler</div>
          </div>
        ))}
      </div>
    </div>
  )
}
