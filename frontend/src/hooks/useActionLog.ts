import { useEffect, useState } from 'react'
import type { RecentActionDto } from '../types/GameState'

/** `unavailable`: het laden mislukte en er is nog nooit een lijst binnengekomen. */
export type ActionLogStatus = 'loading' | 'ready' | 'unavailable'

/**
 * `load` gooit dit zolang er geen verbinding is. Dat is geen fout om te melden: na het herstel
 * verandert `load` (de verbinding zit in zijn deps) en laadt het tabblad vanzelf opnieuw.
 */
export class ActionLogOfflineError extends Error {
  constructor() {
    super('GetActionLog zonder verbinding')
    this.name = 'ActionLogOfflineError'
  }
}

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
 *
 * Een mislukte load laat de lijst staan en gaat naar `onError` (behalve zonder verbinding), een
 * geslaagde naar `onResolved`. Opnieuw proberen gebeurt vanzelf bij de volgende `refreshKey`. Beide
 * callbacks moeten stabiel zijn (`useReportOnce` levert dat), anders laadt elke render opnieuw.
 */
export function useActionLog(
  load: () => Promise<RecentActionDto[]>,
  refreshKey: string,
  onError: () => void,
  onResolved: () => void,
): UseActionLogResult {
  const [actions, setActions] = useState<RecentActionDto[]>([])
  const [status, setStatus] = useState<ActionLogStatus>('loading')

  useEffect(() => {
    let current = true

    load().then(
      (loaded) => {
        if (!current) return
        setActions(loaded)
        setStatus('ready')
        onResolved()
      },
      (loadError: unknown) => {
        if (!current) return
        setStatus((previous) => (previous === 'ready' ? previous : 'unavailable'))
        if (!(loadError instanceof ActionLogOfflineError)) onError()
      },
    )

    return () => {
      current = false
    }
  }, [load, refreshKey, onError, onResolved])

  return { actions, status }
}
