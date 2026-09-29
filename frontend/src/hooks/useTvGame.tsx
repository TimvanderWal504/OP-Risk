import { useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import { useCombatBroadcast } from './useCombatBroadcast'
import { useHeldCombat } from './useHeldCombat'
import { useHeldEvent } from './useHeldEvent'
import { GamePhaseDto, type GameStateDto } from '../types/GameState'
import type { DiceRolledMessage, TerritoryClaimedMessage } from '../types/HubResponses'
import { useReportOnce } from './useReportOnce'
import { retryDelayMs } from './retryBackoff'
import { parseHubError, translateValidationErrors } from '../i18n/hubError'

/**
 * TV-kant van de lobby-flow: roept eenmalig WatchGame(gameId) aan zodra de verbinding
 * open is (de enige aanroep die de TV doet na het handmatig navigeren naar
 * /tv/:gameId — zie het bouwplan), en abonneert daarna puur op "GameStateUpdated".
 * Geen polling: elke wijziging komt via de group-broadcast in GameHub binnen.
 *
 * Mislukt WatchGame, dan zijn er twee gevallen. Een onbekend spel is een eindtoestand
 * (`unknownGame`, de route toont dat als volledig scherm). Elke andere fout is tijdelijk: die wordt
 * één keer een toast, en de hook probeert het zelf opnieuw met oplopende wachttijd — de TV heeft
 * geen bediening (FO §2.1), en zonder geslaagde WatchGame zit deze connectie niet in de spelgroep
 * en komen er geen updates binnen, ook niet als er al een bord in beeld staat.
 */
export function useTvGame(gameId: string) {
  const { connection, connectionState } = useSignalR()
  const [state, setState] = useState<GameStateDto | null>(null)
  const [unknownGame, setUnknownGame] = useState(false)
  const { report, resolved } = useReportOnce('watchGame')
  const [orderRollThrows, setOrderRollThrows] = useState<Record<string, number[]>>({})
  // Telt op bij elk "Verder op TV"-seintje van de host (FO §2.2); de houd-hooks laten dan los.
  const [skipSignal, setSkipSignal] = useState(0)
  // Laatst-geclaimde-gebied-flare (TvClaimingScreen): komt uit het "TerritoryClaimed"-narratief-
  // event, niet uit het vergelijken van twee `territories`-snapshots — dat breekt bij reconnect
  // (geen vorige snapshot) en bij meerdere claims tussen twee broadcasts (welke krijgt de flare?).
  // Start op `null`: geen flare tot de eerstvolgende claim, geaccepteerd (zie bouwplan Blocker 1).
  const [lastClaimedTerritoryId, setLastClaimedTerritoryId] = useState<string | null>(null)

  // Negeert stale snapshots/broadcasts: een WatchGame-respons die terugkomt ná een
  // nieuwere GameStateUpdated (of vice versa) mag de nieuwere state niet overschrijven.
  const applyState = (next: GameStateDto) => {
    setState((current) => (current && next.stateVersion <= current.stateVersion ? current : next))
  }

  useEffect(() => {
    if (!connection) return

    const onUpdate = (updated: GameStateDto) => {
      if (updated.gameId !== gameId) return

      applyState(updated)

      // Alleen leegmaken zodra een nieuw spel weer bij de lobby begint — niet zodra de
      // volgorde net bekend is, anders verdwijnen de worpen tijdens de reveal-hold
      // (useHeldPhase) nog vóórdat de speler ze gezien heeft.
      setOrderRollThrows((current) =>
        updated.phase === GamePhaseDto.Lobby && Object.keys(current).length > 0 ? {} : current,
      )

      // Idem voor de claim-flare: relevant zolang Claiming loopt, leegmaken zodra de fase
      // verlaten is (InitialPlacement of terug naar Lobby bij een nieuw spel).
      setLastClaimedTerritoryId((current) => (updated.phase !== GamePhaseDto.Claiming && current !== null ? null : current))
    }

    const onDiceRolled = (message: DiceRolledMessage) => {
      if (message.context !== 'order-roll') return

      setOrderRollThrows((current) => ({ ...current, [message.playerId]: message.dice }))
    }

    const onTerritoryClaimed = (message: TerritoryClaimedMessage) => {
      setLastClaimedTerritoryId(message.territoryId)
    }

    // "Verder op TV" (FO §2.2): elk seintje telt op; de houd-hooks laten dan los.
    const onHoldsSkipped = () => setSkipSignal((current) => current + 1)

    connection.on('GameStateUpdated', onUpdate)
    connection.on('DiceRolled', onDiceRolled)
    connection.on('TerritoryClaimed', onTerritoryClaimed)
    connection.on('HoldsSkipped', onHoldsSkipped)

    return () => {
      connection.off('GameStateUpdated', onUpdate)
      connection.off('DiceRolled', onDiceRolled)
      connection.off('TerritoryClaimed', onTerritoryClaimed)
      connection.off('HoldsSkipped', onHoldsSkipped)
    }
  }, [connection, gameId])

  useEffect(() => {
    if (!connection || connectionState !== HubConnectionState.Connected) return

    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const watch = (attempt: number) => {
      connection
        .invoke<GameStateDto>('WatchGame', gameId)
        .then((initial) => {
          if (cancelled) return
          applyState(initial)
          setUnknownGame(false)
          resolved()
        })
        .catch((watchError: unknown) => {
          if (cancelled) return
          const errors = parseHubError(watchError instanceof Error ? watchError.message : String(watchError))

          if (errors.some((error) => error.code === 'common.unknownGame')) {
            setUnknownGame(true)

            return
          }

          report(translateValidationErrors(errors))
          retryTimer = setTimeout(() => watch(attempt + 1), retryDelayMs(attempt))
        })
    }

    watch(0)

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
    }
  }, [connection, connectionState, gameId, report, resolved])

  const combat = useHeldCombat(useCombatBroadcast(connection), state, skipSignal)
  const event = useHeldEvent(state, combat !== null, skipSignal)

  return { state, connectionState, unknownGame, orderRollThrows, lastClaimedTerritoryId, combat, event, skipSignal }
}