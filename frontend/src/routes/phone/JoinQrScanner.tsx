import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { PhoneScreen } from '../../components/ui/PhoneScreen'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { Footer } from '../../components/ui/Footer'
import { Button } from '../../components/ui/Button'
import { useQrScanner } from '../../hooks/useQrScanner'
import { gameIdFromJoinUrl } from './joinUrl'

export interface JoinQrScannerProps {
  /** Een gescande join-QR van de TV-lobby (`/play/:gameId`) levert hier de spelcode af. */
  onGameId: (gameId: string) => void
  /** Terug naar het typen van de spelcode. */
  onCancel: () => void
}

/**
 * "Deelnemen" met de camera: dezelfde vorm als het code-invoerscherm (één base-paneel met de H1,
 * daaronder de `Footer`), met het camerabeeld op de plek van het invoerveld.
 */
export function JoinQrScanner({ onGameId, onCancel }: JoinQrScannerProps) {
  const { t } = useTranslation('home')
  const [foreignQr, setForeignQr] = useState(false)
  const { videoRef, error } = useQrScanner((text) => {
    const gameId = gameIdFromJoinUrl(text)

    if (!gameId) {
      setForeignQr(true)

      return false
    }

    onGameId(gameId)

    return true
  })

  return (
    <PhoneShell>
      <PhoneScreen className="gap-4">
        <GlassPanel elevation="base" context="phone" className="rounded-2xl">
          <h1 className="font-display text-h1 font-bold">{t('scan.title')}</h1>
          <p className="mt-2 mb-3 text-sm text-fg-secondary">{t('scan.description')}</p>
          <video
            ref={videoRef}
            muted
            playsInline
            aria-label={t('scan.title')}
            className="aspect-square w-full rounded-input bg-[var(--bg)] object-cover"
          />
        </GlassPanel>
        <Footer
          error={error ? t(`scan.errors.${error}`) : null}
          hint={!error && foreignQr ? t('scan.notAGameQr') : undefined}
        >
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('scan.typeCode')}
          </Button>
        </Footer>
      </PhoneScreen>
    </PhoneShell>
  )
}
