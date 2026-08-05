import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { phoneAnimations } from '../styles/motion'

export interface PlayerEliminatedScreenProps {
  myColor: PlayerColorDto | null
}

/**
 * "9 ELIMINATED" (`isElim`-fase in het oorspronkelijke design). Route-level scherm (`PhonePage.tsx`):
 * geldt door élke fase heen zolang `me.isEliminated` waar is. Bewust géén koppeling aan de
 * combat-narratief-state van het gevecht dat de speler eruit gooide — het drama hoort op de
 * TV (`atlasSlam`), de telefoon is een controller (zie het Attack-bouwplan).
 */
export function PlayerEliminatedScreen({ myColor }: PlayerEliminatedScreenProps) {
  const { t } = useTranslation('attack')

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-5 px-[26px] py-10 text-center"
      style={{ background: 'radial-gradient(90% 60% at 50% 30%, var(--silver), var(--bg))' }}
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-[24px] text-[52px] opacity-50 grayscale-[.5]"
        style={{ background: myColor?.hex, color: myColor?.onHex }}
      >
        {myColor?.symbol}
      </div>
      <div>
        <div className="font-display text-[34px] font-black tracking-[.02em]">{t('elim.title')}</div>
        <div className="mt-2.5 max-w-[280px] font-body text-[15px] text-fg-muted">{t('elim.subtitle')}</div>
      </div>
      <div className="mt-2.5 flex items-center gap-2.5 font-body text-sm text-fg-muted">
        <span className="h-[11px] w-[11px] rounded-full bg-fg-muted" style={{ animation: phoneAnimations.waitingDot }} />
        {t('elim.gameContinues')}
      </div>
    </div>
  )
}
