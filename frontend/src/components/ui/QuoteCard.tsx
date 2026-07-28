import type { CSSProperties } from 'react'

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
    <div className="relative overflow-hidden rounded-[20px] border border-gold-700 bg-[var(--atlas-t04)] p-[22px_22px_20px]">
      <p className="mb-3.5 font-body text-[10px] font-extrabold tracking-[.16em] text-gold-400 uppercase">
        {quoteKicker}
      </p>
      <p className="h-6 font-display text-[52px] leading-[.6] font-black text-gold-600">
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
    </div>
  )
}