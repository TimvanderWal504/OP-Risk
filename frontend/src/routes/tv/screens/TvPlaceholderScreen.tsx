import { useTranslation } from 'react-i18next'
import { GlassPanel } from '../../../components/ui/GlassPanel'

/**
 * Het host-scherm voor een fase die deze bundel (nog) niet toont: de nog niet gebouwde
 * spelfases en de versie-skew-fallback uit `resolveTvScreen`.
 *
 * Staat in een `GlassPanel` (Glass-By-Default Rule), zoals elk ander TV-scherm — zonder paneel
 * valt deze tekst in de "ademband" waar `TvStageBackground`'s scrim geen randalpha zet
 * (DESIGN.md § Layout) en heeft ze geen bescherming tegen de foto erachter. `text-fg-muted`
 * erin krijgt daarmee automatisch de on-glass tekstbehandeling (index.css).
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
