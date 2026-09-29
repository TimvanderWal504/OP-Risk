import { createElement, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTvGame } from '../../hooks/useTvGame'
import { useHeldPhase } from '../../hooks/useHeldPhase'
import { useTvLanguage } from '../../hooks/useTvLanguage'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useToastList } from '../../hooks/useToastList'
import { TvShell, type TvShellProps } from '../../components/ui/TvShell'
import { ToastViewport } from '../../components/ui/ToastViewport'
import { resolveStageScrimLevel, resolveTvOverlay, resolveTvScreen } from './screens/tvScreens'

/**
 * De host-route: verbindt met het spel en laat de fase bepalen welk scherm er hangt, met
 * daarbovenop de overlay-as (motion.ts C9-C12). De schermen zelf staan in `screens/`.
 *
 * De fouttoasts staan binnen dezelfde `TvShell`, zodat de tekstschaal van de host er ook voor
 * geldt (`ToastProvider` rendert ze op de TV niet zelf).
 */
export function TvPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { t } = useTranslation('lobby')
  const { state, unknownGame, orderRollThrows, lastClaimedTerritoryId, combat, event } = useTvGame(gameId!)
  const toastList = useToastList()
  const displayPhase = useHeldPhase(state?.phase)
  useTvLanguage(state?.tvDisplay.language)
  useDocumentTitle('tv')

  let shellProps: Omit<TvShellProps, 'children'> = {}
  let content: ReactNode

  if (unknownGame) {
    content = <div className="flex h-full items-center justify-center text-loss">{t('tv.unknownGame')}</div>
  } else if (!state) {
    content = <div className="flex h-full items-center justify-center text-fg-muted">{t('tv.connecting')}</div>
  } else {
    const screenProps = { state, orderRollThrows, lastClaimedTerritoryId, combat, event }
    const overlay = resolveTvOverlay(combat, event, state.pendingAttrition)

    shellProps = { scrimLevel: resolveStageScrimLevel(displayPhase), display: state.tvDisplay }
    // createElement en niet <Screen …/>: zie PhonePage — het schermtype is dynamisch, de
    // referentie komt uit het module-level register.
    content = (
      <>
        {createElement(resolveTvScreen(displayPhase), screenProps)}
        {overlay && createElement(overlay, screenProps)}
      </>
    )
  }

  return (
    <TvShell {...shellProps}>
      {content}
      <ToastViewport toasts={toastList.toasts} device={toastList.device} onDismiss={toastList.dismiss} />
    </TvShell>
  )
}
