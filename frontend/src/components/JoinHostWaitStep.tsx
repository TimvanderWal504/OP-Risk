import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { Button } from './ui/Button'
import { Footer } from './ui/Footer'
import { phoneAnimations } from '../design-reference/shared/motion'
import { tDynamic } from '../i18n/useT'

export interface JoinHostWaitStepProps {
  players: PlayerDto[]
  colors: PlayerColorDto[]
  maxPlayers: number
  canStart: boolean
  onStart: () => void
  error?: string | null
}

/**
 * Host-lobbyscherm op de telefoon (Telefoon.dc.html L232-263, `isWaiting`) —
 * losstaand van de "0 JOIN"-chrome die de andere join-stappen delen (dit is
 * geen host-variant van {@link JoinWaitStep}, maar een eigen design-sectie
 * met eigen kicker/badge). Geen QR/URL op dit scherm — alleen een hint dat de
 * QR-code op de TV staat (`tvUrlPanel`-achtige weergave heeft hier geen
 * design-instantie, zie de plan-context).
 */
export function JoinHostWaitStep({
  players,
  colors,
  maxPlayers,
  canStart,
  onStart,
  error = null,
}: JoinHostWaitStepProps) {
  const { t } = useTranslation('join')

  return (
    <div className="flex flex-1 flex-col p-[16px_18px]">
      <div className="flex items-center gap-2.5">
        <span className="font-body text-[11px] font-extrabold tracking-[.14em] text-gold-400 uppercase">
          {t('hostWait.kicker')}
        </span>
        <span className="rounded-[6px] bg-gold-400 px-2 py-0.5 font-body text-[10px] font-extrabold tracking-[.08em] text-ink-950">
          {t('hostWait.hostBadge')}
        </span>
      </div>
      <p className="mt-1 font-display text-[26px] font-black">{t('hostWait.title')}</p>

      <div className="mt-3.5 flex items-center gap-2.5 rounded-card border border-secondary bg-[rgba(33,92,156,.14)] p-3.5">
        <span className="text-[22px]">📺</span>
        <span className="text-sm text-fg-secondary">{t('hostWait.qrHint')}</span>
      </div>

      <div className="mt-[18px] mb-2 flex items-center justify-between px-0.5">
        <span className="font-body text-[11px] font-extrabold tracking-[.12em] text-fg-muted uppercase">
          {t('hostWait.joinedLabel')}
        </span>
        <span className="font-display text-[18px] font-black text-pitch-400">
          {players.length} / {maxPlayers}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {players.map((player) => {
          const color = colors.find((c) => c.id === player.colorId)

          return (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-card border border-border bg-[var(--atlas-t03)] p-[11px_13px]"
              style={{ animation: phoneAnimations.rowRise }}
            >
              <span
                className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] text-[19px]"
                style={{ background: color?.hex ?? 'var(--surface-3)', color: color?.onHex }}
              >
                {color?.symbol && <ColorSymbol symbol={color.symbol} />}
              </span>
              <span className="flex-1 font-display text-[17px] font-extrabold">{player.name}</span>
              <span className="text-xs text-fg-muted">
                {color ? tDynamic(color.id, 'colors') : ''}
              </span>
              {player.isHost && <span className="text-sm">👑</span>}
            </div>
          )
        })}
      </div>

      <Footer error={error} hint={!canStart ? t('hostWait.waitingForPlayers') : undefined}>
        <Button disabled={!canStart} onClick={onStart}>
          {canStart ? t('hostWait.startGame') : t('hostWait.startGameWait')}
        </Button>
      </Footer>
    </div>
  )
}
