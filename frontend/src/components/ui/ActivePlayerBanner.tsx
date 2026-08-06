import type { PlayerColorDto } from '../../types/GameState'
import { ColorAvatar } from './ColorAvatar'

export interface ActivePlayerBannerProps {
  /** Prefix vóór de spelersnaam, bv. "Aan de beurt" — samengevoegd met de naam op één regel. */
  turnOfLabel: string
  playerName: string
  color: PlayerColorDto | null | undefined
  /** Faseduiding naast de naam, bv. "Claimen" — al gekleurd in `color.hex`. */
  subtitle: string
  /** Rechteropgestelde teller (bv. vrije gebieden), alleen in Claim's variant (L431). */
  stat?: { value: number | string; label: string }
}

/**
 * "Nu aan zet"-banner (`claimMineNot`- en `isIdle`-substaten in het oorspronkelijke design) —
 * identieke kaart in beide substaten (padding 13px 14px, radius 16px, gap 12px).
 */
export function ActivePlayerBanner({ turnOfLabel, playerName, color, subtitle, stat }: ActivePlayerBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-[var(--atlas-t03)] px-3.5 py-[13px]">
      <ColorAvatar color={color} variant="banner" />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[20px] font-extrabold">
          {turnOfLabel} {playerName} <span style={{ color: color?.hex }}>{`· ${subtitle}`}</span>
        </div>
      </div>
      {stat && (
        <div className="flex-none text-right">
          <div className="font-display text-[26px] leading-none font-black text-silver-300">{stat.value}</div>
          <div className="font-body text-[10px] text-fg-muted">{stat.label}</div>
        </div>
      )}
    </div>
  )
}
