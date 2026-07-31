import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto, RoleSummaryDto } from '../types/GameState'
import { PlayerAvatar } from './ui/PlayerAvatar'
import { tDynamic } from '../i18n/useT'
import { tvAnimations } from '../design-reference/shared/motion'

export interface LobbyPlayerListProps {
  players: PlayerDto[]
  colors: PlayerColorDto[]
  roles: RoleSummaryDto[]
  maxPlayers: number
}

/** Spelerskaarten + wacht-slot (TV, FO §2.1). */
export function LobbyPlayerList({ players, colors, roles, maxPlayers }: LobbyPlayerListProps) {
  const { t } = useTranslation('lobby')
  const hasOpenSlot = players.length < maxPlayers

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[22px] border border-[var(--atlas-glass-border)] bg-[var(--atlas-glass)] p-[22px_22px_20px] shadow-[0_24px_60px_rgba(0,0,0,.4)]">
      <div className="mb-[14px] flex items-center justify-between">
        <span className="font-body text-[16px] font-extrabold tracking-[.14em] text-pitch-500 uppercase">
          {t('players.title')}
        </span>
        <span className="font-display text-[24px] font-black text-pitch-400">
          {players.length} / {maxPlayers}
        </span>
      </div>
      <div className="grid content-start grid-cols-2 gap-[10px]">
        {players.map((player) => {
          const color = colors.find((c) => c.id === player.colorId)
          const role = roles.find((r) => r.id === player.roleId)

          return (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-[13px] border border-[var(--atlas-glass-border)] bg-[var(--atlas-glass-row)] p-[11px_13px]"
              style={{ animation: tvAnimations.lobbyCardIn }}
            >
              <PlayerAvatar
                size="xs"
                colorHex={color?.hex}
                colorOnHex={color?.onHex}
                colorSymbol={color?.symbol}
              />
              <div className="min-w-0">
                <div className="truncate font-display text-[19px] leading-[1.1] font-extrabold text-fg">
                  {player.name}
                </div>
                <div className="truncate text-[14px] text-pitch-500">
                  {color ? tDynamic(color.id, 'colors') : t('players.noColorYet')}
                  {role && (
                    <span className="inline-block" style={{ animation: tvAnimations.lobbyRoleIn }}>
                      {` · ${tDynamic(`${role.id}.name`, 'roles')}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {hasOpenSlot && (
          <div className="flex items-center gap-3 rounded-[13px] border-2 border-dashed border-border-strong p-[11px_13px] opacity-70">
            <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] border-2 border-dashed border-fg-muted text-[22px] text-fg-muted">
              +
            </div>
            <div className="text-[14px] text-fg-secondary">{t('players.waitingForPlayer')}</div>
          </div>
        )}
      </div>
    </div>
  )
}
