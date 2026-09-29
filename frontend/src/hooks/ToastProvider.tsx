import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastViewport } from '../components/ui/ToastViewport'
import { toastAutoDismissMs } from '../styles/motion'
import type { ToastDevice, ToastItem, ToastTone } from '../types/Toast'
import { ToastCtx, ToastListCtx } from './ToastContext'

export interface ToastProviderProps {
  device: ToastDevice
  children: ReactNode
}

/**
 * Houdt de zichtbare fouttoasts bij. Elke toast verdwijnt na `toastAutoDismissMs[device]`, of
 * eerder door wegklikken of `clearSource`.
 *
 * Op de telefoon rendert de provider ze zelf, via de portal van `ToastViewport`. Op de TV niet:
 * daar moeten ze binnen `TvShell` staan, waar de tekstschaal van de host geldt — de TV-route leest
 * de lijst via `useToastList` en rendert `ToastViewport` zelf.
 *
 * De lijst staat ook in een ref, zodat `showError` kan ontdubbelen zonder bij elke wijziging een
 * nieuwe functie te worden — aanroepers (`useGameState.invoke`) hangen er hun eigen `useCallback`
 * aan op.
 */
export function ToastProvider({ device, children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const listRef = useRef<ToastItem[]>([])
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const nextIdRef = useRef(0)

  const commit = useCallback((next: ToastItem[]) => {
    listRef.current = next
    setToasts(next)
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      clearTimeout(timersRef.current.get(id))
      timersRef.current.delete(id)
      commit(listRef.current.filter((toast) => toast.id !== id))
    },
    [commit],
  )

  const show = useCallback(
    (message: string, tone: ToastTone, source?: string) => {
      const existing = listRef.current.find((toast) => toast.message === message && toast.tone === tone)
      const id = existing?.id ?? ++nextIdRef.current

      if (!existing) commit([...listRef.current, { id, message, tone, source }])

      clearTimeout(timersRef.current.get(id))
      timersRef.current.set(
        id,
        setTimeout(() => dismiss(id), toastAutoDismissMs[device]),
      )
    },
    [commit, dismiss, device],
  )

  const showError = useCallback((message: string, source?: string) => show(message, 'error', source), [show])
  const showInfo = useCallback((message: string) => show(message, 'info'), [show])

  const clearSource = useCallback(
    (source: string) => {
      const cleared = listRef.current.filter((toast) => toast.source === source)

      if (cleared.length === 0) return

      for (const toast of cleared) {
        clearTimeout(timersRef.current.get(toast.id))
        timersRef.current.delete(toast.id)
      }

      commit(listRef.current.filter((toast) => toast.source !== source))
    },
    [commit],
  )

  useEffect(() => {
    const timers = timersRef.current

    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  const api = useMemo(() => ({ showError, showInfo, dismiss, clearSource }), [showError, showInfo, dismiss, clearSource])
  const list = useMemo(() => ({ toasts, device, dismiss }), [toasts, device, dismiss])

  return (
    <ToastCtx.Provider value={api}>
      <ToastListCtx.Provider value={list}>
        {children}
        {device === 'phone' && <ToastViewport toasts={toasts} device="phone" onDismiss={dismiss} />}
      </ToastListCtx.Provider>
    </ToastCtx.Provider>
  )
}
