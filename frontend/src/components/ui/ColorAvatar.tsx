import type { PlayerColorDto } from '../../types/GameState'
import { ColorSymbol } from './ColorSymbol'

export interface ColorAvatarProps {
  color: PlayerColorDto | null | undefined
  /** `banner`: 46px/radius 12px/tekst 24px (Telefoon.dc.html L429,475). `row`: 34px/radius 9px/tekst 16px (L437,461). */
  variant: 'banner' | 'row'
}

const VARIANTS = {
  banner: 'h-[46px] w-[46px] rounded-xl text-2xl',
  row: 'h-[34px] w-[34px] rounded-[9px] text-base',
} as const

/**
 * Gekleurd vak met kleurensymbool, gebruikt voor de "aan zet"-banner en de
 * spelerrijen in Claim/Startopstelling (Telefoon.dc.html L392-469).
 */
export function ColorAvatar({ color, variant }: ColorAvatarProps) {
  return (
    <span
      className={`flex flex-none items-center justify-center ${VARIANTS[variant]}`}
      style={{ background: color?.hex ?? 'var(--surface-3)', color: color?.onHex }}
    >
      {color?.symbol && <ColorSymbol symbol={color.symbol} />}
    </span>
  )
}
