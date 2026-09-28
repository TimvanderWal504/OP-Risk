import { useContext } from 'react'
import { ToastCtx, type ToastApi } from './ToastContext'

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast moet binnen <ToastProvider> gebruikt worden')
  return ctx
}
