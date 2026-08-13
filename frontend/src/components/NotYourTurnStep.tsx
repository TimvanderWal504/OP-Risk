import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { ActivePlayerBanner } from './ui/ActivePlayerBanner'
import { GlassPanel } from './ui/GlassPanel'
import { PhoneScreen } from './ui/PhoneScreen'

export interface NotYourTurnStepProps {
  activePlayerName: string
  activeColor: PlayerColorDto | null
  /** Faseduiding naast de naam (bv. "Claimen"), gelokaliseerd door de aanroeper. */
  subtitle: string
}

/**
 * Generiek "niet jouw beurt"-scherm (`isIdle`-fase in het oorspronkelijke design), gedeeld over
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
    <PhoneScreen>
      <ActivePlayerBanner
        turnOfLabel={t('idle.nowPlaying')}
        playerName={activePlayerName}
        color={activeColor}
        subtitle={subtitle}
      />
      {/* BEVINDING, opgelost (2026-08-13, gebruiker gescreenshot): deze regel stond als enige
          element van dit scherm kaal op de stage-illustratie, precies op de onderrand waar de
          scrim wél randalpha zet maar de foto het lichtst is. Chip-idioom (strak op de tekst
          gesneden), zelfde vorm als de voetnoot op HomePage. */}
      <GlassPanel
        elevation="base"
        context="phone"
        padding="none"
        className="mt-auto self-center rounded-2xl px-4 py-1.5 text-center font-body text-[12.5px] text-fg-muted"
      >
        {t('idle.turnComesToYou')}
      </GlassPanel>
    </PhoneScreen>
  )
}
