export interface SwitchProps {
  on: boolean
  onToggle: () => void
  disabled?: boolean
  /** Toegankelijke naam; de slider heeft zelf geen zichtbaar label. */
  label?: string
}

/** Aan/uit-schuifknop (30×52). De enige bron voor de toggle-slider — alle
 * toggles in de app leunen hierop, zodat ze niet uit elkaar kunnen lopen. */
export function Switch({ on, onToggle, disabled = false, label }: SwitchProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={label}
      className={`relative h-[30px] w-[52px] flex-none rounded-chip transition-colors ${
        on ? 'bg-pitch-500' : 'bg-white/12'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-[3px] left-0 h-6 w-6 rounded-full bg-white transition-transform ${
          on ? 'translate-x-[25px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}
