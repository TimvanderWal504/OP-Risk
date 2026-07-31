import { symbolGlyph } from '../../design-reference/shared/design-tokens'

export interface ColorSymbolProps {
  symbol: string
  className?: string
}

/**
 * Kleurenblind-vriendelijk onderscheidingsteken per spelerskleur (data/colors.json
 * `symbol`-veld) — puur weergave, de kleur zelf komt van de aanroeper (colorHex/CSS-var).
 * De symboolnaam → glyph-tabel komt uit de token-extractie (`symbolGlyph`), niet uit een
 * eigen kopie hier: één bron per waarde (frontend/CLAUDE.md, tokens).
 */
export function ColorSymbol({ symbol, className }: ColorSymbolProps) {
  return (
    <span aria-hidden className={className}>
      {symbolGlyph[symbol as keyof typeof symbolGlyph] ?? ''}
    </span>
  )
}
