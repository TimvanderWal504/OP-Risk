import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto, RoleSummaryDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { JoinProgressHeader } from './ui/JoinProgressHeader'
import { phoneAnimations } from '../design-reference/shared/motion'
import { tDynamic } from '../i18n/useT'

export interface JoinWaitStepProps {
  me: PlayerDto
  color: PlayerColorDto | null
  role: RoleSummaryDto | null
  joinedCount: number
  stepIndex: number
  stepCount: number
}

/**
 * Laatste join-stap voor een niet-host speler (Telefoon.dc.html L332-343,
 * `joinWait`): wachten tot de host start. De host krijgt een eigen scherm
 * ({@link JoinHostWaitStep}, `isWaiting`, L232-263) — geen host/niet-host-
 * variant van dit component, twee losse design-secties.
 */
export function JoinWaitStep({ me, color, role, joinedCount, stepIndex, stepCount }: JoinWaitStepProps) {
  const { t } = useTranslation('join')

  return (
    <div className="flex flex-1 flex-col p-5">
      <JoinProgressHeader currentStep={stepIndex} stepCount={stepCount} />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div
          className="flex h-[78px] w-[78px] items-center justify-center rounded-[20px] text-[42px]"
          style={{
            background: color?.hex ?? 'var(--surface-3)',
            color: color?.onHex,
            boxShadow: color ? `0 0 30px ${color.hex}88` : undefined,
            animation: phoneAnimations.popImmediate,
          }}
        >
          {color?.symbol && <ColorSymbol symbol={color.symbol} />}
        </div>
        <div>
          <p className="font-display text-[26px] font-black">{t('wait.title')}</p>
          <p className="mt-1.5 text-[16px] text-fg-muted">
            {me.name} · {color ? tDynamic(color.id, 'colors') : t('wait.noColor')}
          </p>
          {role && <p className="mt-1 text-[13px] text-gold-300">{tDynamic(`${role.id}.name`, 'roles')}</p>}
        </div>
        <div className="flex items-center gap-2.5 text-[15px] text-fg-muted">
          <span
            className="h-[11px] w-[11px] rounded-full"
            style={{ background: 'var(--pitch-400)', animation: phoneAnimations.waitingDot }}
          />
          {t('wait.waitingForHost')}
        </div>
        <p className="font-mono text-[14px] text-fg-muted">
          {t('wait.playersPresent', { count: joinedCount })}
        </p>
      </div>
    </div>
  )
}
