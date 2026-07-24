import { ColorSymbol } from './ColorSymbol'

export interface PlayerAvatarProps {
  colorHex?: string | null
  colorSymbol?: string | null
  isHost: boolean
  size?: 'sm' | 'lg'
}

/** Gekleurde tegel met een host-ster, of anders het kleurenblind-vriendelijke
 * kleursymbool; valt terug op een neutrale achtergrond zolang de speler nog
 * geen kleur heeft. */
export function PlayerAvatar({ colorHex, colorSymbol, isHost, size = 'sm' }: PlayerAvatarProps) {
  const sizeClass = size === 'lg' ? 'h-20 w-20 text-3xl' : 'h-14 w-14 text-2xl'

  return (
    <div
      className={`flex flex-none items-center justify-center rounded-2xl ${sizeClass}`}
      style={{
        background: colorHex ?? 'var(--surface-3)',
        boxShadow: colorHex ? `0 0 18px ${colorHex}55` : undefined,
      }}
    >
      {isHost ? '★' : colorSymbol && <ColorSymbol symbol={colorSymbol} />}
    </div>
  )
}
