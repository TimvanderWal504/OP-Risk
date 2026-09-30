import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { phoneAnimations, tvAnimations } from '../../styles/motion'
import type { ToastDevice, ToastItem } from '../../types/Toast'
import { Toast } from './Toast'
import { useToastAnchorInset } from '../../hooks/useToastAnchorInset'

export interface ToastViewportProps {
  toasts: ToastItem[]
  device: ToastDevice
  onDismiss: (id: number) => void
}

/**
 * De toastlaag, op `z-[70]`: boven de hoogste modal (`DefendStep`, `z-[60]`) en de TV-gevechts-
 * overlay, want juist daar ontstaan fouten die zichtbaar moeten blijven.
 *
 * - Telefoon: onderaan, net boven de knoppen van het scherm (`toastAnchor`, besluit gebruiker
 *   2026-09-29), even breed als `PhoneShell`, via een portal naar `document.body`.
 * - TV: binnen `TvShell` (daar geldt de tekstschaal van de host), in hetzelfde raster als de
 *   bordschermen (`TvMainBoardScreen`), onderaan de kaartkolom — direct boven de verlooprij.
 *
 * Twee live regions, die er ook zonder toasts staan (een live region die pas samen met zijn inhoud
 * verschijnt, wordt door schermlezers niet altijd voorgelezen): `role="alert"` voor fouten en een
 * beleefde `role="status"` voor neutrale meldingen, zodat nieuws niet als alarm wordt voorgelezen.
 */
export function ToastViewport({ toasts, device, onDismiss }: ToastViewportProps) {
  // Beide van onder binnen: de telefoon staat boven de knoppen, de TV boven de verlooprij.
  const animation = device === 'tv' ? tvAnimations.toastIn : phoneAnimations.toastIn
  const layerRef = useRef<HTMLDivElement>(null)
  const anchorInset = useToastAnchorInset(device === 'phone' && toasts.length > 0, layerRef)
  const render = (tone: ToastItem['tone']) =>
    toasts
      .filter((toast) => toast.tone === tone)
      .map((toast) => (
        <div key={toast.id} className="pointer-events-auto" style={{ animation }}>
          <Toast message={toast.message} device={device} tone={toast.tone} onDismiss={() => onDismiss(toast.id)} />
        </div>
      ))

  const regions = (className: string) => (
    <>
      <div role="alert" className={className}>
        {render('error')}
      </div>
      <div role="status" className={className}>
        {render('info')}
      </div>
    </>
  )

  if (device === 'tv') return <TvLayer>{regions('flex flex-col items-center gap-2')}</TvLayer>

  return createPortal(
    <div ref={layerRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-[70]">
      <div
        className="mx-auto flex w-full max-w-[430px] flex-col gap-2 px-gutter"
        // 8px boven de knoppen (de stapelafstand tussen toasts); zonder knoppen de gewone marge.
        style={{ paddingBottom: anchorInset > 0 ? anchorInset + 8 : 'var(--spacing-gutter)' }}
      >
        {regions('flex flex-col gap-2')}
      </div>
    </div>,
    document.body,
  )
}

function TvLayer({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[70] grid grid-cols-[1fr_402px] grid-rows-[96px_1fr_146px] gap-4 gap-x-6.5 p-6 px-6.5">
      <div className="col-start-1 row-start-2 flex flex-col items-center justify-end gap-2">{children}</div>
    </div>
  )
}
