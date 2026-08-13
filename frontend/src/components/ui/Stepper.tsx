import { useTranslation } from 'react-i18next'
import { GlassPanel } from './GlassPanel'

export interface StepperProps {
  label: string
  sub: string
  /** Reeds geformatteerde waarde (bv. "20" of "3:00"). */
  value: string
  onDecrement: () => void
  onIncrement: () => void
  canDecrement?: boolean
  canIncrement?: boolean
  /** Font-size (px) van de weergegeven waarde. Default 22 (beurttimer-instantie). */
  valueFontSize?: number
  /** min-width (px) van de weergegeven waarde. Default 52 (beurttimer-instantie). */
  valueMinWidth?: number
}

/** Rij met label + subtekst en een −/waarde/+ stapper. Klemmen (min/max)
 * gebeurt bij de aanroeper; `canDecrement`/`canIncrement` grijzen de knop uit. */
export function Stepper({
  label,
  sub,
  value,
  onDecrement,
  onIncrement,
  canDecrement = true,
  canIncrement = true,
  valueFontSize = 22,
  valueMinWidth = 52,
}: StepperProps) {
  const { t } = useTranslation('common')

  return (
    <GlassPanel elevation="base" context="phone" padding="none" className="flex flex-col gap-3 rounded-[14px] px-3.5 py-3">
      <div className="w-full">
        <div className="font-display text-base font-extrabold">{label}</div>
        <div className="text-[11.5px] text-fg-muted">{sub}</div>
      </div>
      <div className="w-full flex flex-row justify-between gap-3">
        <GlassPanel elevation="raised" context="phone" padding="none" className="h-11 w-11 flex-none rounded-[11px]" style={{ borderColor: 'var(--border-strong)' }}>
          <button
            type="button"
            aria-label={t('stepper.decrement', { label })}
            disabled={!canDecrement}
            onClick={onDecrement}
            className="flex h-full w-full cursor-pointer items-center justify-center text-[22px] font-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
        </GlassPanel>
        <span
          className="text-center font-display font-black tabular-nums self-center"
          style={{ fontSize: valueFontSize, minWidth: valueMinWidth }}
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={t('stepper.increment', { label })}
          disabled={!canIncrement}
          onClick={onIncrement}
          className="h-11 w-11 flex-none cursor-pointer rounded-[11px] border-none bg-pitch-500 text-[22px] font-black text-[var(--on-pitch)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
        </div>
    </GlassPanel>
  )
}
