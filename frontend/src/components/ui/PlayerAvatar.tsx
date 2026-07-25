import { ColorSymbol } from './ColorSymbol'

export interface PlayerAvatarProps {
  colorHex?: string | null
  colorOnHex?: string | null
  colorSymbol?: string | null
  size?: 'sm' | 'lg'
}

/** Gekleurde tegel met het kleurenblind-vriendelijke kleursymbool; valt terug
 * op een neutrale achtergrond zolang de speler nog geen kleur heeft.
 * `colorOnHex` is de contrastkleur uit colors.json voor het symbool bovenop
 * `colorHex` (nooit zelf een kleur verzinnen). Host-status wordt nergens in
 * het design op deze tegel zelf getoond (altijd een los badge/naast de naam,
 * context-afhankelijk) en hoort dus niet in dit component. */
export function PlayerAvatar({ colorHex, colorOnHex, colorSymbol, size = 'sm' }: PlayerAvatarProps) {
  const sizeClass = size === 'lg' ? 'h-20 w-20 text-3xl' : 'h-14 w-14 text-2xl'

  return (
    <div
      className={`flex flex-none items-center justify-center rounded-2xl ${sizeClass}`}
      style={{
        background: colorHex ?? 'var(--surface-3)',
        boxShadow: colorHex ? `0 0 18px ${colorHex}55` : undefined,
        color: colorOnHex ?? undefined,
      }}
    >
      {colorSymbol && <ColorSymbol symbol={colorSymbol} />}
    </div>
  )
}
