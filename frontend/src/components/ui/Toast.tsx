import { useTranslation } from 'react-i18next'
import type { ToastDevice, ToastTone } from '../../types/Toast'
import { GlassPanel } from './GlassPanel'
import { CloseIcon } from './icons'

export interface ToastProps {
  message: string
  device: ToastDevice
  /** `error` in Loss Red; `info` (nieuws) in de glas-tekstkleur. Standaard `error`. */
  tone?: ToastTone
  onDismiss: () => void
}

/**
 * Eén fouttoast: de melding in dezelfde `text-loss`-kleur als de footer-foutregel die hij
 * vervangt, op een `raised` glaspaneel. Op de telefoon met een kruisje om 'm weg te klikken; de TV
 * heeft geen bediening (FO §2.1), daar verdwijnt hij alleen vanzelf. Positionering en binnenkomst
 * horen bij `ToastViewport`.
 */
export function Toast({ message, device, tone = 'error', onDismiss }: ToastProps) {
  const { t } = useTranslation('common')

  return (
    <GlassPanel elevation="raised" context={device} className="flex items-start gap-3">
      <p className={`flex-1 ${tone === 'error' ? 'text-loss' : 'text-fg'}`}>{message}</p>
      {device === 'phone' && (
        <button type="button" aria-label={t('toast.dismiss')} onClick={onDismiss} className="-m-2 flex-none p-2 text-fg-secondary">
          <CloseIcon />
        </button>
      )}
    </GlassPanel>
  )
}
