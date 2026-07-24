const GLYPHS: Record<string, string> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  diamond: '◆',
  star: '★',
  hexagon: '⬡',
  cross: '✚',
}

export interface ColorSymbolProps {
  symbol: string
  className?: string
}

/**
 * Kleurenblind-vriendelijk onderscheidingsteken per spelerskleur (data/colors.json
 * `symbol`-veld) — puur weergave, de kleur zelf komt van de aanroeper (colorHex/CSS-var).
 */
export function ColorSymbol({ symbol, className }: ColorSymbolProps) {
  return (
    <span aria-hidden className={className}>
      {GLYPHS[symbol] ?? ''}
    </span>
  )
}
