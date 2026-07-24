import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

/** Grote actieknop. `variant` wisselt tussen de brand-knop (primary) en een
 * neutrale outline-knop (secondary); `disabled` grijst 'm uit (bv. een nog
 * niet-uitvoerbare actie zoals "Claim een gebied"). Neemt alle native
 * button-props over (`onClick`, `type`, `disabled`, …). */
export function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'bg-pitch-500 text-fg-onbrand shadow-[0_8px_22px_rgba(132,173,40,.3)]'
      : 'border border-border-strong bg-white/5 text-fg'

  return (
    <button
      type={type}
      className={`min-h-16 w-full rounded-card font-display text-lg font-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
