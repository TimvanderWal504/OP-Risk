import { useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import { useCombatBroadcast } from './useCombatBroadcast'
import { useHeldCombat } from './useHeldCombat'
import { GamePhaseDto, type GameStateDto } from '../types/GameState'
import type { DiceRolledMessage, TerritoryClaimedMessage } from '../types/HubResponses'
import { parseHubError, translateValidationErrors } from '../i18n/hubError'

/**
 * TV-kant van de lobby-flow: roept eenmalig WatchGame(gameId) aan zodra de verbinding
 * open is (de enige aanroep die de TV doet na het handmatig navigeren naar
 * /tv/:gameId — zie het bouwplan), en abonneert daarna puur op "GameStateUpdated".
 * Geen polling: elke wijziging komt via de group-broadcast in GameHub binnen.
 */
export function useTvGame(gameId: string) {
  const { connection, connectionState } = useSignalR()
  const [state, setState] = useState<GameStateDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderRollThrows, setOrderRollThrows] = useState<Record<string, number[]>>({})
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

    connection.on('GameStateUpdated', onUpdate)
    connection.on('DiceRolled', onDiceRolled)
    connection.on('TerritoryClaimed', onTerritoryClaimed)

    return () => {
      connection.off('GameStateUpdated', onUpdate)
      connection.off('DiceRolled', onDiceRolled)
      connection.off('TerritoryClaimed', onTerritoryClaimed)
    }
  }, [connection, gameId])

  useEffect(() => {
    if (!connection || connectionState !== HubConnectionState.Connected) return

    let cancelled = false

    connection
      .invoke<GameStateDto>('WatchGame', gameId)
      .then((initial) => {
        if (!cancelled) {
          applyState(initial)
          setError(null)
        }
      })
      .catch((watchError: unknown) => {
        if (!cancelled) {
          const message = watchError instanceof Error ? watchError.message : String(watchError)
          setError(translateValidationErrors(parseHubError(message)))
        }
      })

    return () => {
      cancelled = true
    }
  }, [connection, connectionState, gameId])

  const combat = useHeldCombat(useCombatBroadcast(connection), state)

  return { state, connectionState, error, orderRollThrows, lastClaimedTerritoryId, combat }
}