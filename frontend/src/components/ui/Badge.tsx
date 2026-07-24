import type { ReactNode } from 'react'

export interface BadgeProps {
  children: ReactNode
  tone?: 'gold-outline' | 'pitch-solid'
}

const TONE_CLASS: Record<NonNullable<BadgeProps['tone']>, string> = {
  'gold-outline': 'border border-gold-700 text-gold-400',
  'pitch-solid': 'bg-pitch-400 text-fg-onbrand',
}

/** Kleine pil/chip voor fase-kickers en labels (hergebruikt de `rounded-chip`-token). */
export function Badge({ children, tone = 'gold-outline' }: BadgeProps) {
  return (
    <span
      className={`rounded-chip px-4 py-1.5 font-body text-xs font-extrabold tracking-wide uppercase ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  )
}
