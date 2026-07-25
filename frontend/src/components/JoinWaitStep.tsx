import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto, RoleSummaryDto } from '../types/GameState'
import { TvUrlPanel } from './TvUrlPanel'
import { PlayerAvatar } from './ui/PlayerAvatar'
import { Button } from './ui/Button'

export interface JoinWaitStepProps {
  gameId: string
  me: PlayerDto
  color: PlayerColorDto | null
  role: RoleSummaryDto | null
  joinedCount: number
  isHost: boolean
  canStart: boolean
  onStart: () => void
  error?: string | null
}

/** Laatste join-stap (FO §3): wachten in de lobby; host ziet ook start-knop + TV-url. */
export function JoinWaitStep({
  gameId,
  me,
  color,
  role,
  joinedCount,
  isHost,
  canStart,
  onStart,
  error = null,
}: JoinWaitStepProps) {
  const { t } = useTranslation('join')

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-5 text-center">
      <PlayerAvatar colorHex={color?.hex} colorSymbol={color?.symbol} isHost={me.isHost} size="lg" />
      <div>
        <p className="font-display text-h1 font-black">{t('wait.title')}</p>
        <p className="text-fg-muted">
          {me.name} · {color?.name ?? t('wait.noColor')}
        </p>
        {role && <p className="text-sm text-gold-300">{role.name}</p>}
      </div>
      <p className="font-mono text-fg-muted">{t('wait.playersPresent', { count: joinedCount })}</p>

      {isHost ? (
        <div className="flex w-full flex-col gap-3">
          <TvUrlPanel gameId={gameId} />
          {error && <p className="text-loss">{error}</p>}
          <Button disabled={!canStart} onClick={onStart}>
            {t('wait.startGame')}
          </Button>
          {!canStart && <p className="text-xs text-fg-muted">{t('wait.waitingForPlayers')}</p>}
        </div>
      ) : (
        <p className="text-fg-muted">{t('wait.waitingForHost')}</p>
      )}
    </div>
  )
}
