import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { phoneAnimations, tvAnimations } from '../../styles/motion'
import type { ToastDevice, ToastItem } from '../../types/Toast'
import { Toast } from './Toast'

export interface ToastViewportProps {
  toasts: ToastItem[]
  device: ToastDevice
  onDismiss: (id: number) => void
}

/**
 * De toastlaag, op `z-[70]`: boven de hoogste modal (`DefendStep`, `z-[60]`) en de TV-gevechts-
 * overlay, want juist daar ontstaan fouten die zichtbaar moeten blijven.
 *
 * - Telefoon: bovenaan, even breed als `PhoneShell`, via een portal naar `document.body`.
 * - TV: binnen `TvShell` (daar geldt de tekstschaal van de host), in hetzelfde raster als de
 *   bordschermen (`TvMainBoardScreen`), onderaan de kaartkolom — direct boven de verlooprij.
 *
 * De `role="alert"`-lijst staat er ook zonder toasts: een live region die pas samen met zijn
 * inhoud verschijnt, wordt door schermlezers niet altijd voorgelezen.
 */
export function ToastViewport({ toasts, device, onDismiss }: ToastViewportProps) {
  // Telefoon: van boven binnen (hangt bovenaan); TV: van onder (staat boven de verlooprij).
  const animation = device === 'tv' ? tvAnimations.toastIn : phoneAnimations.toastIn
  const items = toasts.map((toast) => (
    <div key={toast.id} className="pointer-events-auto" style={{ animation }}>
      <Toast message={toast.message} device={device} onDismiss={() => onDismiss(toast.id)} />
    </div>
  ))

  if (device === 'tv') return <TvLayer>{items}</TvLayer>

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70]">
      <div role="alert" className="mx-auto flex w-full max-w-[430px] flex-col gap-2 px-gutter pt-gutter">
        {items}
      </div>
    </div>,
    document.body,
  )
}

function TvLayer({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[70] grid grid-cols-[1fr_402px] grid-rows-[96px_1fr_146px] gap-4 gap-x-6.5 p-6 px-6.5">
      <div role="alert" className="col-start-1 row-start-2 flex flex-col items-center justify-end gap-2">
        {children}
      </div>
    </div>
  )
}
