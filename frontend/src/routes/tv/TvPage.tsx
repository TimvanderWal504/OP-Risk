import { createElement } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTvGame } from '../../hooks/useTvGame'
import { useHeldPhase } from '../../hooks/useHeldPhase'
import { TvShell } from '../../components/ui/TvShell'
import { resolveStageScrimLevel, resolveTvOverlay, resolveTvScreen } from './screens/tvScreens'

/**
 * De host-route: verbindt met het spel en laat de fase bepalen welk scherm er hangt, met
 * daarbovenop de overlay-as (motion.ts C9-C12). De schermen zelf staan in `screens/`.
 */
export function TvPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { t } = useTranslation('lobby')
  const { state, error, orderRollThrows, lastClaimedTerritoryId, combat } = useTvGame(gameId!)
  const displayPhase = useHeldPhase(state?.phase)

  if (error) {
    return (
      <TvShell>
        <div className="flex h-full items-center justify-center text-loss">{t('tv.unknownGame')}</div>
      </TvShell>
    )
  }

  if (!state) {
    return (
      <TvShell>
        <div className="flex h-full items-center justify-center text-fg-muted">{t('tv.connecting')}</div>
      </TvShell>
    )
  }

  const screenProps = { state, orderRollThrows, lastClaimedTerritoryId, combat }
  const overlay = resolveTvOverlay(combat)

  // createElement en niet <Screen …/>: zie PhonePage — het schermtype is dynamisch, de
  // referentie komt uit het module-level register.
  return (
    <TvShell scrimLevel={resolveStageScrimLevel(displayPhase)}>
      {createElement(resolveTvScreen(displayPhase), screenProps)}
      {overlay && createElement(overlay, screenProps)}
    </TvShell>
  )
}
