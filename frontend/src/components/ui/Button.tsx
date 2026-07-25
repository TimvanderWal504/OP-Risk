import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold'
  children: ReactNode
}

/** Grote actieknop. `variant` wisselt tussen de brand-knop (primary, bv.
 * "Start spel"), een neutrale outline-knop (secondary) en de gouden CTA-knop
 * (gold, bv. "Gooien" bij de startvolgorde-worp — Telefoon.dc.html L259/371
 * gebruiken elk hun eigen letterlijke kleur, geen gedeelde primary-tint);
 * `disabled` grijst 'm uit (bv. een nog niet-uitvoerbare actie zoals "Claim
 * een gebied"). Neemt alle native button-props over (`onClick`, `type`,
 * `disabled`, …). */
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
      : variant === 'gold'
        ? 'bg-gold-400 text-ink-950 shadow-[0_8px_22px_rgba(242,169,34,.35)]'
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
