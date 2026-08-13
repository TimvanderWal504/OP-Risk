import type { CSSProperties } from 'react'
import { GlassPanel } from './GlassPanel'

export interface QuoteCardProps {
  quoteKicker: string
  quoteText: string
  quoteAuthor: string
  quoteIndex?: number
  animationStyle?: CSSProperties
}

export function QuoteCard({
  quoteKicker,
  quoteText,
  quoteAuthor,
  quoteIndex,
  animationStyle,
}: QuoteCardProps) {
  return (
    <GlassPanel
      elevation="base"
      context="phone"
      padding="none"
      className="relative overflow-hidden rounded-[20px] p-[22px_22px_20px]"
      style={{ borderColor: 'var(--silver-700)' }}
    >
      <p className="mb-3.5 font-body text-[10px] font-extrabold tracking-[.16em] text-silver-400 uppercase">
        {quoteKicker}
      </p>
      <p className="h-6 font-display text-[52px] leading-[.6] font-black text-silver-600">
        {'“'}
      </p>
      <p
        key={quoteIndex}
        className="font-display text-[20px] font-extrabold leading-[1.32] text-fg"
        style={animationStyle}
      >
        {quoteText}
      </p>
      <p className="mt-3.5 font-body text-[13px] text-fg-muted">
        — {quoteAuthor}
      </p>
    </GlassPanel>
  )
}