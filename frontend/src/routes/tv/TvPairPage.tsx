import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTvPairing } from '../../hooks/useTvPairing'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { TvShell } from '../../components/ui/TvShell'
import { TvWaitingLayout } from '../../components/TvWaitingLayout'
import { QrCodePanel } from '../../components/ui/QrCodePanel'

/**
 * "TV koppelen" (route `/tv`): dit scherm wordt de TV. Toont een QR naar `/pair/:pairingCode`;
 * de host scant die, maakt een spel aan, en de TV gaat door naar `/tv/:gameId`.
 */
export function TvPairPage() {
  const { t } = useTranslation('tvPairing')
  const { pairingCode, pairedGameId, failed } = useTvPairing()
  useDocumentTitle('tv')

  if (pairedGameId) {
    return <Navigate to={`/tv/${pairedGameId}`} replace />
  }

  const pairUrl = pairingCode ? `${window.location.origin}/pair/${pairingCode}` : null
  const status = failed ? t('tv.failed') : pairUrl ? t('tv.waiting') : t('tv.connecting')

  return (
    <TvShell>
      <TvWaitingLayout badge={t('tv.badge')} status={status}>
        {pairingCode && pairUrl && (
          <QrCodePanel
            url={pairUrl}
            code={pairingCode}
            title={t('tv.scanTitle')}
            ariaLabel={t('tv.ariaLabel', { url: pairUrl })}
          />
        )}
      </TvWaitingLayout>
    </TvShell>
  )
}
