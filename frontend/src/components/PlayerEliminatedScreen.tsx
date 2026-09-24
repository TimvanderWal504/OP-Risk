import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { GlassPanel } from './ui/GlassPanel'
import { phoneAnimations } from '../styles/motion'
import { PhoneScreen } from './ui/PhoneScreen'
import phoneEliminated from '../styles/assets/phone-eliminated.webp'

export interface PlayerEliminatedScreenProps {
  myColor: PlayerColorDto | null
  /** Extra actie(s) alleen voor de host — nu de TV-weergave (`TvDisplayAccess`,
   *  plan-testronde-tv punt 2): een uitgeschakelde host blijft de TV bedienen. */
  hostActions?: ReactNode
}

/**
 * "9 ELIMINATED"-scherm. Route-level (`PhonePage.tsx`): geldt door élke fase heen zolang
 * `me.isEliminated` waar is. Bewust géén koppeling aan de combat-narratief-state van het
 * gevecht dat de speler eruit gooide — het drama hoort op de TV (`atlasSlam`), de telefoon is
 * een controller (zie het Attack-bouwplan).
 *
 * Eigen achtergrondfoto (`phone-eliminated.webp`) i.p.v. de gedeelde `PhoneStageBackground`
 * (`phone-battlefield.webp`) erachter — via `PhoneScreen`'s `style`-ontsnappingsluik, dat
 * hier al deze rol had (voorheen een radiale gradient). De content zit in één `GlassPanel`
 * zodat tekst de al bestaande on-glass-behandeling (`.text-fg`/`.text-fg-muted` binnen
 * `.glass-panel`, `index.css`) krijgt: lichte `--fg1`-tekst + text-shadow i.p.v. de gewone
 * grijstinten, nodig om 4.5:1-contrast te houden tegen een foto in plaats van de vlakke kaart
 * waar die grijstinten voor getuned zijn.
 *
 * `grid`/`text-center`/`mx-auto` i.p.v. `justify-items-center`: zelfde patroon als
 * `FortifyFlowStep.tsx`'s `fortifiesRemaining`-/`amount`-blokken (`my-auto grid gap-* ... text-center`).
 * Grid-items blijven op hun default `stretch`, zodat het paneel de volle kaartbreedte pakt en
 * tekst daarbinnen centreert; `justify-items-center` zou elke rij juist laten krimpen tot zijn
 * eigen inhoud, met een te smal/wisselend paneel als gevolg — vandaar de vaste `mx-auto` op de
 * badge en de breedte-begrensde subtitle.
 */
export function PlayerEliminatedScreen({ myColor, hostActions }: PlayerEliminatedScreenProps) {
  const { t } = useTranslation('attack')

  return (
    <PhoneScreen style={{ backgroundImage: `url(${phoneEliminated})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <GlassPanel elevation="base" context="phone" padding="none" className="my-auto grid gap-5 rounded-2xl p-4 text-center">
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-[24px] text-size10"
          style={{ background: myColor?.hex, color: myColor?.onHex }}
        >
          {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
        </div>
        <div>
          <div className="font-display text-size8 font-black tracking-[.02em] text-fg">{t('elim.title')}</div>
          <div className="mx-auto mt-2.5 max-w-[280px] font-body text-body text-fg-muted">{t('elim.subtitle')}</div>
        </div>
        <div className="flex items-center justify-center gap-2.5 font-body text-sm text-fg-muted">
          <span className="h-[11px] w-[11px] rounded-full bg-fg-muted" style={{ animation: phoneAnimations.waitingDot }} />
          {t('elim.gameContinues')}
        </div>
      </GlassPanel>
      {hostActions && <div className="flex flex-col gap-3">{hostActions}</div>}
    </PhoneScreen>
  )
}
