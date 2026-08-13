import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto, RoleSummaryDto } from '../types/GameState'
import { JoinProgressHeader } from './ui/JoinProgressHeader'
import { GlassPanel } from './ui/GlassPanel'
import { phoneAnimations } from '../styles/motion'
import { tDynamic } from '../i18n/useT'
import { QuoteCard } from './ui/QuoteCard'
import { PhoneScreen } from './ui/PhoneScreen'

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
 * Laatste join-stap voor een niet-host speler (uit het oorspronkelijke design,
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
    <PhoneScreen>
      <JoinProgressHeader currentStep={stepIndex} stepCount={stepCount} />
      <div className="flex min-h-0 flex-1 flex-col items-center pt-2.5 text-center">
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          {/* BEVINDING, opgelost (2026-08-10): titelblok + wacht-/tellingregels stonden kaal op
              de stage-achtergrond — zie dezelfde fix in OrderRollWaitStep.tsx. Chip-idioom,
              geen volle kaart; QuoteCard blijft ongewijzigd (draagt al zijn eigen achtergrond). */}
          <GlassPanel elevation="base" context="phone" padding="none" className="flex-1 rounded-2xl px-4 py-2.5">
            <p className="font-display text-[26px] font-black">{t('wait.title')}</p>
            <p className="mt-1.5 font-body text-h3 text-fg-muted">
              {me.name} · {color ? tDynamic(color.id, 'colors') : t('wait.noColor')}
            </p>
            {role && (
              <p className="mt-1 font-body text-sm text-pitch-400">
                {tDynamic(`${role.id}.name`, 'roles')} · {tDynamic(role.originTerritory, 'territories')}
              </p>
            )}
          </GlassPanel>
          <div className="flex flex-[11] flex-col items-center justify-center">
            <QuoteCard
              quoteKicker={t('wait.quoteKicker')}
              quoteText={tDynamic(`quote-${quoteIndex}.text`, 'quotes')}
              quoteAuthor={tDynamic(`quote-${quoteIndex}.author`, 'quotes')}
              quoteIndex={quoteIndex}
              animationStyle={{ animation: phoneAnimations.popImmediate }}
            />
          </div>
          {/* Wachtregel + spelerstelling in één paneel (2026-08-13): twee losse chips onder elkaar
              zeggen hetzelfde ("waar wacht je op, en met hoeveel") en lazen als twee losstaande
              berichten. De telling staat als secundaire regel onder de wachtregel; ze deelden al
              dezelfde `text-fg-muted`-behandeling. */}
          <GlassPanel
            elevation="base"
            context="phone"
            padding="none"
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-4 py-2"
          >
            <span className="flex items-center gap-2.5 font-body text-body text-fg-muted">
              <span
                className="h-[11px] w-[11px] rounded-full"
                style={{ background: 'var(--pitch-400)', animation: phoneAnimations.waitingDot }}
              />
              {t('wait.waitingForHost')}
            </span>
            <span className="font-body text-sm text-fg-muted">
              {t('wait.playersPresent', { count: joinedCount })}
            </span>
          </GlassPanel>
        </div>
      </div>
    </PhoneScreen>
  )
}
