import { useTranslation } from 'react-i18next'
import { GlassPanel } from '../../../components/ui/GlassPanel'

/**
 * Het host-scherm voor een fase die deze bundel (nog) niet toont: de nog niet gebouwde
 * spelfases en de versie-skew-fallback uit `resolveTvScreen`.
 *
 * BEVINDING, opgelost (2026-08-11): stond eerder als kale tekst direct op de
 * stage-illustratie, gecentreerd — precies de "ademband" waar de gedeelde
 * verticale scrim (`TvStageBackground`) bewust géén randalpha zet (zie DESIGN.md
 * § Layout). Zonder paneel eromheen kreeg deze tekst dus geen enkele bescherming
 * tegen de foto erachter — enige TV-scherm zonder `GlassPanel` en zonder eigen
 * scrim/text-shadow-behandeling (elk ander TV-scherm heeft er wél een, zie
 * TvLobbyScreen/TvClaimingScreen/etc.). Nu net als de rest van het systeem op een
 * `GlassPanel` (Glass-By-Default Rule); `text-fg-muted` erin krijgt daarmee
 * automatisch de on-glass tekstbehandeling (index.css, The On-Glass Text Rule).
 */
export function TvPlaceholderScreen() {
  const { t } = useTranslation('lobby')

  return (
    <div className="flex h-full mx-auto max-w-[1550px] items-center justify-center">
      <GlassPanel elevation="base" context="tv" className="text-h3 text-fg-muted">
        {t('placeholder.tv')}
      </GlassPanel>
    </div>
  )
}
