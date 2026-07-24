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
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={`rounded-input border border-gold-600 bg-white/5 p-4 font-display text-h3 font-bold ${
        uppercase ? 'uppercase' : ''
      }`}
    />
  )
}
