export interface PlayerAvatarProps {
  colorHex?: string | null
  isHost: boolean
  size?: 'sm' | 'lg'
}

/** Gekleurde tegel met een host-ster; valt terug op een neutrale achtergrond
 * zolang de speler nog geen kleur heeft. */
export function PlayerAvatar({ colorHex, isHost, size = 'sm' }: PlayerAvatarProps) {
  const sizeClass = size === 'lg' ? 'h-20 w-20 text-3xl' : 'h-14 w-14 text-2xl'

  return (
    <div
      className={`flex flex-none items-center justify-center rounded-2xl ${sizeClass}`}
      style={{ background: colorHex ?? 'var(--surface-3)' }}
    >
      {isHost ? '★' : ''}
    </div>
  )
}
