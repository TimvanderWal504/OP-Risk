import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../../types/Player'
import type { PlayerColorDto, TurnPhaseDto, TurnTimerDto } from '../../types/GameState'
import { TurnPhaseDto as TurnPhase } from '../../types/GameState'
import { ColorSymbol } from '../ui/ColorSymbol'
import { useCountdown } from '../../hooks/useCountdown'
import { tvAnimations } from '../../styles/motion'

export interface TurnStatusHeaderProps {
  activePlayer: PlayerDto
  activeColor: PlayerColorDto | undefined
  turnPhase: TurnPhaseDto
  timer: TurnTimerDto | null
}

/**
 * De low-drempel (60s) stond niet in het oorspronkelijke design: dat doorliep
 * `normal/low/paused` puur als demo-cyclus, zonder numerieke aanleiding. Productbeslissing,
 * expliciet nagevraagd en vastgelegd bij het bouwen van dit component (zelfde status als
 * `ORDER_ROLL_REVEAL_HOLD_MS` in `useHeldPhase.ts`) — geen waarde uit `motion.ts`/de export.
 */
const TIMER_LOW_THRESHOLD_MS = 60_000

function formatTimer(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const PHASE_ORDER: TurnPhaseDto[] = [TurnPhase.Reinforce, TurnPhase.Attack, TurnPhase.Fortify]
const PHASE_LABEL_KEY: Record<TurnPhaseDto, 'phaseReinforce' | 'phaseAttack' | 'phaseFortify'> = {
  [TurnPhase.Reinforce]: 'phaseReinforce',
  [TurnPhase.Attack]: 'phaseAttack',
  [TurnPhase.Fortify]: 'phaseFortify',
}

/**
 * Topbalk van het TV-hoofdbord ("Main board"-state, `isBoard`, uit het oorspronkelijke design):
 * beurt-chip, fasepillen en beurttimer. Markup/tokens 1-op-1 uit die sectie, `atlasTok()` via
 * `boardTok` (design-tokens.ts) voor het speler-symbool-blok.
 */
export function TurnStatusHeader({ activePlayer, activeColor, turnPhase, timer }: TurnStatusHeaderProps) {
  const { t } = useTranslation('board')
  const remainingMs = useCountdown(timer)
  const isPaused = timer?.isPaused ?? false
  const isLow = !isPaused && remainingMs < TIMER_LOW_THRESHOLD_MS

  return (
    <div className="col-span-full flex items-center justify-between px-3.5">
      <div key={activePlayer.id} className="flex items-center gap-4.5" style={{ animation: tvAnimations.turnChipSwap }}>
        {activeColor && (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[16px] text-[34px]"
            style={{ background: activeColor.hex, color: activeColor.onHex, boxShadow: `0 0 24px ${activeColor.hex}99` }}
          >
            <ColorSymbol symbol={activeColor.symbol} />
          </div>
        )}
        <div className="font-display text-[34px] font-black leading-none">
          {t('turnOf')} {activePlayer.name}{' '}
          {activeColor && <span className="text-[24px] font-bold text-fg-muted">· {activeColor.name}</span>}
        </div>
      </div>

      <div className="flex gap-3">
        {PHASE_ORDER.map((phase) =>
          phase === turnPhase ? (
            <div
              key={phase}
              className="rounded-xl bg-pitch-400 px-6.5 py-3 font-display text-2xl font-black tracking-[.01em] text-[var(--on-pitch)]"
              style={{ animation: tvAnimations.phasePillPop, boxShadow: '0 0 30px color-mix(in srgb, var(--pitch-400) 55%, transparent)' }}
            >
              {t(PHASE_LABEL_KEY[phase])}
            </div>
          ) : (
            <div
              key={phase}
              className="rounded-xl border border-border bg-[var(--atlas-row)] px-6 py-3 font-display text-h2 font-bold text-fg-muted"
            >
              {t(PHASE_LABEL_KEY[phase])}
            </div>
          ),
        )}
      </div>

      <div className="flex flex-row items-end">
        <span className="mr-1 self-center font-body text-sm font-extrabold uppercase tracking-[.16em] text-fg-muted">
          {t('timerLabel')}
        </span>
        {isPaused ? (
          <div
            className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border-strong px-5.5 py-3 font-display text-[30px] font-extrabold leading-none text-fg-muted"
            style={{ animation: tvAnimations.timerSwap }}
          >
            <span className="inline-flex gap-[5px]">
              <span className="h-6.5 w-[7px] rounded-sm bg-fg-muted" />
              <span className="h-6.5 w-[7px] rounded-sm bg-fg-muted" />
            </span>
            {t('timerPaused')}
          </div>
        ) : isLow ? (
          <div
            className="rounded-xl border-[3px] px-5.5 py-1 font-display text-[56px] font-black leading-none tabular-nums"
            style={{ color: '#ff4d52', borderColor: '#ff4d52', boxShadow: '0 0 34px rgba(255,77,82,.6)', animation: tvAnimations.timerLow }}
          >
            {formatTimer(remainingMs)}
          </div>
        ) : (
          <div
            className="rounded-xl border-2 border-border-strong px-5.5 py-1 font-display text-[56px] font-black leading-none tabular-nums text-fg"
            style={{ animation: tvAnimations.timerSwap }}
          >
            {formatTimer(remainingMs)}
          </div>
        )}
      </div>
    </div>
  )
}
