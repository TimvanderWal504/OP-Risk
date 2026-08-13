import { GlassPanel } from './GlassPanel'

export interface TextFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  /** Toont en normaliseert de invoer in hoofdletters (bv. een spelcode). */
  uppercase?: boolean
  ariaLabel?: string
}

/** Groot tekstinvoerveld in de app-stijl (gold-omrand). */
export function TextField({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  uppercase = false,
  ariaLabel,
}: TextFieldProps) {
  return (
    <GlassPanel elevation="raised" context="phone" padding="none" className="rounded-input" style={{ borderColor: 'var(--silver-600)' }}>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full bg-transparent p-4 font-display text-h3 font-bold outline-none ${uppercase ? 'uppercase' : ''}`}
      />
    </GlassPanel>
  )
}
