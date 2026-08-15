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
 * Generiek "niet jouw beurt"-scherm, gedeeld over setup/reinf/attack/fortify — `subtitle` i.p.v.
 * een fase-specifieke prop, zodat latere fases dit component hergebruiken i.p.v. een duplicaat.
 *
 * Afwijking: geen "recent gebeurd"-feed en geen "terwijl je wacht"-snelkoppelingen naar
 * regels/missie/kaarten. Beide hebben geen backend-tegenhanger in deze plak (geen
 * activiteiten-log, geen missie-/regelpaneel) — weggelaten i.p.v. met verzonnen inhoud gevuld;
 * volgt zodra die data bestaat.
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
      {/* Chip-idioom (strak op de tekst gesneden), zelfde vorm als de voetnoot op HomePage — deze
          regel staat als enig element van het scherm op de stage-illustratie. */}
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
