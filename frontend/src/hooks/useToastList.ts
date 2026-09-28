import { useContext } from 'react'
import { ToastListCtx, type ToastList } from './ToastContext'

export function useToastList(): ToastList {
  const ctx = useContext(ToastListCtx)
  if (!ctx) throw new Error('useToastList moet binnen <ToastProvider> gebruikt worden')
  return ctx
}
