import type { PlayerColorDto } from '../../types/GameState'
import { ColorSymbol } from './ColorSymbol'

export interface ColorAvatarProps {
  color: PlayerColorDto | null | undefined
  /** `banner`: 46px/radius 12px/tekst 24px. `row`: 34px/radius 9px/tekst 16px.
   *  `reinforce`: 32px/radius 9px/tekst 15px (Versterken-rij). */
  variant: 'banner' | 'row' | 'reinforce'
}

const VARIANTS = {
  banner: 'h-[46px] w-[46px] rounded-xl text-2xl',
  row: 'h-[34px] w-[34px] rounded-[9px] text-base',
  reinforce: 'h-8 w-8 rounded-[9px] text-[15px]',
} as const

/**
 * Gekleurd vak met kleurensymbool, gebruikt voor de "aan zet"-banner en de
 * spelerrijen in Claim/Startopstelling.
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
