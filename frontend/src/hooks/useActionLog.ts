import { useEffect, useState } from 'react'
import type { RecentActionDto } from '../types/GameState'

export type ActionLogStatus = 'loading' | 'ready' | 'error'

export interface UseActionLogResult {
  /** Het volledige verloop, nieuwste eerst; leeg tot het eerste antwoord binnen is. */
  actions: RecentActionDto[]
  status: ActionLogStatus
}

/**
 * Het volledige verloop voor het tabblad Spelverloop (besluit gebruiker 2026-09-26). De state
 * stuurt er maar een paar mee, dus het tabblad vraagt het zelf op via `load`
 * (`useGameState.loadActionLog`) bij het openen, en opnieuw zodra `refreshKey` verandert (de
 * bovenste regel van `state.recentActions`), zodat een open tabblad meeloopt met het spel.
 *
 * Alleen het laatste verzoek telt: een antwoord dat binnenkomt nadat de sleutel al weer veranderd
 * is, of nadat het tabblad dicht is, wordt genegeerd. Tijdens het verversen blijft de vorige lijst
 * staan; `loading` geldt alleen tot het eerste antwoord.
 */
export function useActionLog(load: () => Promise<RecentActionDto[]>, refreshKey: string): UseActionLogResult {
  const [actions, setActions] = useState<RecentActionDto[]>([])
  const [status, setStatus] = useState<ActionLogStatus>('loading')

  useEffect(() => {
    let current = true

    load().then(
      (loaded) => {
        if (!current) return
        setActions(loaded)
        setStatus('ready')
      },
      () => {
        if (current) setStatus('error')
      },
    )

    return () => {
      current = false
    }
  }, [load, refreshKey])

  return { actions, status }
}
