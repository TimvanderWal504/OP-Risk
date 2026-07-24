export interface StepperProps {
  label: string
  sub: string
  /** Reeds geformatteerde waarde (bv. "20" of "3:00"). */
  value: string
  onDecrement: () => void
  onIncrement: () => void
  canDecrement?: boolean
  canIncrement?: boolean
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
}: StepperProps) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-white/3 px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-extrabold">{label}</div>
        <div className="text-[11.5px] text-fg-muted">{sub}</div>
      </div>
      <button
        type="button"
        aria-label={`${label} verlagen`}
        disabled={!canDecrement}
        onClick={onDecrement}
        className="h-11 w-11 flex-none cursor-pointer rounded-input border border-border-strong bg-white/5 text-[22px] font-black disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-13 text-center font-display text-[22px] font-black tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={`${label} verhogen`}
        disabled={!canIncrement}
        onClick={onIncrement}
        className="h-11 w-11 flex-none cursor-pointer rounded-input border-none bg-pitch-500 text-[22px] font-black text-[#04060b] disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
