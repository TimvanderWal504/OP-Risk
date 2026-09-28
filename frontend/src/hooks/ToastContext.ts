import { createContext } from 'react'
import type { ToastDevice, ToastItem } from '../types/Toast'

export interface ToastApi {
  /** Toont `message` als fouttoast. Staat dezelfde tekst er al, dan begint alleen zijn timer opnieuw. */
  showError: (message: string, source?: string) => void
  dismiss: (id: number) => void
  /** Ruimt alle toasts van `source` op — een geslaagde volgende poging maakt de oude fout achterhaald. */
  clearSource: (source: string) => void
}

export const ToastCtx = createContext<ToastApi | null>(null)

/** Wat de TV-route nodig heeft om de toasts zelf in haar `TvShell` te renderen (`useToastList`). */
export interface ToastList {
  toasts: ToastItem[]
  device: ToastDevice
  dismiss: (id: number) => void
}

export const ToastListCtx = createContext<ToastList | null>(null)
