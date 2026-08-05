import type { ReactNode } from 'react'

export interface BadgeProps {
  children: ReactNode
  tone?: 'silver-outline' | 'pitch-solid'
}

const TONE_CLASS: Record<NonNullable<BadgeProps['tone']>, string> = {
  'silver-outline': 'border border-silver-700 text-silver-400',
  'pitch-solid': 'bg-pitch-400 text-fg-onbrand',
}

/** Kleine pil/chip voor fase-kickers en labels (hergebruikt de `rounded-chip`-token). */
export function Badge({ children, tone = 'silver-outline' }: BadgeProps) {
  return (
    <span
      className={`rounded-chip px-4 py-1.5 font-body text-xs font-extrabold tracking-wide uppercase ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  )
}
