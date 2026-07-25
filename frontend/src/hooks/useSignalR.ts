import { useContext } from 'react'
import { GameHubCtx } from './GameHubContext'

export function useSignalR() {
  const ctx = useContext(GameHubCtx)
  if (!ctx) throw new Error('useSignalR moet binnen <GameHubProvider> gebruikt worden')
  return ctx
}
