import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto, RoleSummaryDto } from '../types/GameState'
import { JoinProgressHeader } from './ui/JoinProgressHeader'
import { phoneAnimations } from '../design-reference/shared/motion'
import { tDynamic } from '../i18n/useT'
import { QuoteCard } from './ui/QuoteCard'

const QUOTE_COUNT = 300
const QUOTE_INTERVAL_MS = 7000

export interface JoinWaitStepProps {
  me: PlayerDto
  color: PlayerColorDto | null
  role: RoleSummaryDto | null
  joinedCount: number
  stepIndex: number
  stepCount: number
}

/**
 * Laatste join-stap voor een niet-host speler (Telefoon.dc.html L336-356,
 * `joinWait`): wachten tot de host start. Geen kleur-symbooltegel — de export
 * toont alleen titel, `naam · kleur` en (indien gekozen) `rol · herkomstland`,
 * daaronder de roterende quote-kaart. De host krijgt een eigen scherm
 * ({@link JoinHostWaitStep}, `isWaiting`, L232-263) — geen host/niet-host-
 * variant van dit component, twee losse design-secties.
 */
export function JoinWaitStep({ me, color, role, joinedCount, stepIndex, stepCount }: JoinWaitStepProps) {
  const { t } = useTranslation('join')
  const [quoteIndex, setQuoteIndex] = useState(() => 1 + Math.floor(Math.random() * QUOTE_COUNT))

  useEffect(() => {
    const timer = setInterval(
      () => setQuoteIndex((current) => (current % QUOTE_COUNT) + 1),
      QUOTE_INTERVAL_MS,
    )

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-1 flex-col p-5">
      <JoinProgressHeader currentStep={stepIndex} stepCount={stepCount} />
      <div className="flex min-h-0 flex-1 flex-col items-center pt-2.5 text-center">
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <div className="flex-1">
            <p className="font-display text-[26px] font-black">{t('wait.title')}</p>
            <p className="mt-1.5 font-body text-[16px] text-fg-muted">
              {me.name} · {color ? tDynamic(color.id, 'colors') : t('wait.noColor')}
            </p>
            {role && (
              <p className="mt-1 font-body text-[13px] text-pitch-400">
                {tDynamic(`${role.id}.name`, 'roles')} · {tDynamic(role.originTerritory, 'territories')}
              </p>
            )}
          </div>
          <div className="flex flex-[11] flex-col items-center justify-center">
            <QuoteCard
              quoteKicker={t('wait.quoteKicker')}
              quoteText={tDynamic(`quote-${quoteIndex}.text`, 'quotes')}
              quoteAuthor={tDynamic(`quote-${quoteIndex}.author`, 'quotes')}
              quoteIndex={quoteIndex}
              animationStyle={{ animation: phoneAnimations.popImmediate }}
            />
          </div>
          <div className="flex flex-1 items-center gap-2.5 font-body text-[15px] text-fg-muted">
            <span
              className="h-[11px] w-[11px] rounded-full"
              style={{ background: 'var(--pitch-400)', animation: phoneAnimations.waitingDot }}
            />
            {t('wait.waitingForHost')}
          </div>
        </div>
        <p className="pt-1.5 font-mono text-[14px] text-fg-muted">
          {t('wait.playersPresent', { count: joinedCount })}
        </p>
      </div>
    </div>
  )
}
