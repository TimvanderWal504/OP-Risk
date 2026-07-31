import { ColorSymbol } from './ColorSymbol'

export interface PlayerAvatarProps {
  colorHex?: string | null
  colorOnHex?: string | null
  colorSymbol?: string | null
  size?: 'xs' | 'sm' | 'lg'
}

const SIZE_CLASS: Record<NonNullable<PlayerAvatarProps['size']>, string> = {
  xs: 'h-[42px] w-[42px] rounded-[11px] text-[22px]',
  sm: 'h-14 w-14 rounded-2xl text-2xl',
  lg: 'h-20 w-20 rounded-2xl text-3xl',
}

const SIZE_GLOW_BLUR: Record<NonNullable<PlayerAvatarProps['size']>, number> = {
  xs: 14,
  sm: 18,
  lg: 18,
}

/** Gekleurde tegel met het kleurenblind-vriendelijke kleursymbool; valt terug
 * op een neutrale achtergrond zolang de speler nog geen kleur heeft.
 * `colorOnHex` is de contrastkleur uit colors.json voor het symbool bovenop
 * `colorHex` (nooit zelf een kleur verzinnen). Host-status wordt nergens in
 * het design op deze tegel zelf getoond (altijd een los badge/naast de naam,
 * context-afhankelijk) en hoort dus niet in dit component. */
export function PlayerAvatar({ colorHex, colorOnHex, colorSymbol, size = 'sm' }: PlayerAvatarProps) {
  return (
    <div
      className={`flex flex-none items-center justify-center ${SIZE_CLASS[size]}`}
      style={{
        background: colorHex ?? 'var(--surface-3)',
        boxShadow: colorHex ? `0 0 ${SIZE_GLOW_BLUR[size]}px ${colorHex}55` : undefined,
        color: colorOnHex ?? undefined,
      }}
    >
      {colorSymbol && <ColorSymbol symbol={colorSymbol} />}
    </div>
  )
}
