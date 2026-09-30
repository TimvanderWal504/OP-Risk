import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { ToastDevice, ToastTone } from '../../types/Toast'
import { GlassPanel } from './GlassPanel'
import { AlertIcon, CloseIcon, NoticeIcon } from './icons'

export interface ToastProps {
  message: string
  device: ToastDevice
  /** `error` in Loss Red; `info` (nieuws) in de glas-tekstkleur. Standaard `error`. */
  tone?: ToastTone
  onDismiss: () => void
}

/**
 * Eén toast: een fout in dezelfde `text-loss`-kleur als de footer-foutregel die hij verving, of
 * nieuws in de glas-tekstkleur, op een `raised` glaspaneel. Dat paneel is hier dicht (de
 * ondoorzichtige tint) met een rand in de toonkleur en een icoon ervoor — een doorschijnende toast
 * viel op de telefoon weg tegen het scherm eronder (besluit gebruiker 2026-09-29). Op de telefoon met een kruisje om 'm weg te klikken; de TV
 * heeft geen bediening (FO §2.1), daar verdwijnt hij alleen vanzelf. Positionering en binnenkomst
 * horen bij `ToastViewport`.
 */
export function Toast({ message, device, tone = 'error', onDismiss }: ToastProps) {
  const { t } = useTranslation('common')

  return (
    <GlassPanel elevation="raised" context={device} className="flex items-start gap-3" style={toneSurface[tone]}>
      {tone === 'error' ? (
        <AlertIcon className="mt-[.15em] h-[1.1em] w-[1.1em] flex-none text-loss" />
      ) : (
        <NoticeIcon className="mt-[.15em] h-[1.1em] w-[1.1em] flex-none text-silver-300" />
      )}
      <p className={`flex-1 ${tone === 'error' ? 'text-loss' : 'text-fg'}`}>{message}</p>
      {device === 'phone' && (
        <button type="button" aria-label={t('toast.dismiss')} onClick={onDismiss} className="-m-2 flex-none p-2 text-fg-secondary">
          <CloseIcon />
        </button>
      )}
    </GlassPanel>
  )
}

/** Dicht paneel (de fallback-tint van `GlassPanel` zelf) met een rand in de toonkleur. */
const toneSurface: Record<ToastTone, CSSProperties> = {
  error: { '--glass-bg': 'var(--glass-bg-opaque)', '--glass-border': 'var(--color-loss)' } as CSSProperties,
  info: { '--glass-bg': 'var(--glass-bg-opaque)', '--glass-border': 'var(--color-silver-400)' } as CSSProperties,
}
