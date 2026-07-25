import { useTranslation } from 'react-i18next'

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
    <div className="flex items-center gap-3 rounded-[14px] border border-border bg-white/3 px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-extrabold">{label}</div>
        <div className="text-[11.5px] text-fg-muted">{sub}</div>
      </div>
      <button
        type="button"
        aria-label={t('stepper.decrement', { label })}
        disabled={!canDecrement}
        onClick={onDecrement}
        className="h-11 w-11 flex-none cursor-pointer rounded-[11px] border border-border-strong bg-white/5 text-[22px] font-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span
        className="text-center font-display font-black tabular-nums"
        style={{ fontSize: valueFontSize, minWidth: valueMinWidth }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={t('stepper.increment', { label })}
        disabled={!canIncrement}
        onClick={onIncrement}
        className="h-11 w-11 flex-none cursor-pointer rounded-[11px] border-none bg-pitch-500 text-[22px] font-black text-[#04060b] disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
