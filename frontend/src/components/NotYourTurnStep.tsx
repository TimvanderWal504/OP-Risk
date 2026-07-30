import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { ActivePlayerBanner } from './ui/ActivePlayerBanner'

export interface NotYourTurnStepProps {
  activePlayerName: string
  activeColor: PlayerColorDto | null
  /** Faseduiding naast de naam (bv. "Claimen"), gelokaliseerd door de aanroeper. */
  subtitle: string
}

/**
 * Generiek "niet jouw beurt"-scherm (Telefoon.dc.html L471-499, `isIdle`), gedeeld over
 * setup/reinf/attack/fortify (`inGame`-statemachine, L1554-1557) — `subtitle` i.p.v. een
 * fase-specifieke prop, zodat latere fases dit component hergebruiken i.p.v. een duplicaat.
 *
 * Afwijking: het design toont hier ook een "recent gebeurd"-feed (`idleFeed`, L478-486) en
 * "terwijl je wacht"-snelkoppelingen naar regels/missie/kaarten (`tabCards`, L487-496). Beide
 * hebben geen backend-tegenhanger in deze plak (geen activiteiten-log, geen missie-/
 * regelpaneel) — weggelaten i.p.v. met verzonnen inhoud gevuld; volgt zodra die data bestaat.
 */
export function NotYourTurnStep({ activePlayerName, activeColor, subtitle }: NotYourTurnStepProps) {
  const { t } = useTranslation('setup')

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4">
      <ActivePlayerBanner
        kicker={t('idle.nowPlaying')}
        playerName={activePlayerName}
        color={activeColor}
        subtitle={subtitle}
      />
      <div className="mt-auto pt-3 text-center font-body text-[12.5px] text-fg-muted">
        {t('idle.turnComesToYou')}
      </div>
    </div>
  )
}
