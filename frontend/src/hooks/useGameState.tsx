import { useCallback, useEffect, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import { GamePhaseDto, type GameStateDto } from '../types/GameState'
import type { DiceRolledMessage, JoinGameResponse, OrderRollResponse } from '../types/HubResponses'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import { parseHubError, translateValidationErrors } from '../i18n/hubError'

const playerIdKey = (gameId: string) => `game:${gameId}:playerId`

/**
 * Speler-kant van de lobby-flow (telefoon, FO §3): join/kleur/rol/start via de hub,
 * geabonneerd op "GameStateUpdated" zodat acties van andere spelers direct doorkomen.
 * Toont nooit voorspelde state — alleen wat de server bevestigt (frontend/CLAUDE.md).
 *
 * playerId wordt in sessionStorage bewaard en na elke (re)connect via RejoinGame
 * teruggemeld aan de hub, want SignalR-groepslidmaatschap gaat verloren bij reconnect
 * én bij page refresh (nieuwe connection-id in beide gevallen).
 */
export function useGameState(gameId: string) {
  const { connection, connectionState } = useSignalR()
  const [state, setState] = useState<GameStateDto | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(
    () => sessionStorage.getItem(playerIdKey(gameId)),
  )
  const [error, setError] = useState<string | null>(null)
  const [orderRollThrows, setOrderRollThrows] = useState<Record<string, number[]>>({})
  const [territoryCatalog, setTerritoryCatalog] = useState<TerritoryCatalogDto[]>([])

  const persistPlayerId = useCallback(
    (id: string) => {
      sessionStorage.setItem(playerIdKey(gameId), id)
      setPlayerId(id)
    },
    [gameId],
  )

  // Negeert stale snapshots/broadcasts: een respons die terugkomt ná een nieuwere
  // GameStateUpdated (of vice versa) mag de nieuwere state niet overschrijven.
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
    }

    const onDiceRolled = (message: DiceRolledMessage) => {
      if (message.context !== 'order-roll') return

      setOrderRollThrows((current) => ({ ...current, [message.playerId]: message.dice }))
    }

    connection.on('GameStateUpdated', onUpdate)
    connection.on('DiceRolled', onDiceRolled)

    return () => {
      connection.off('GameStateUpdated', onUpdate)
      connection.off('DiceRolled', onDiceRolled)
    }
  }, [connection, gameId])

  // Haalt de read-only state al op vóórdat er is gejoind, zodra er nog geen bekende
  // playerId is — nodig omdat de samengevoegde naam+kleur-stap (JoinNameColorStep) de
  // echte kleurenpalet uit state.colors toont op het allereerste scherm, dus vóór
  // JoinGame is aangeroepen. WatchGame is dezelfde niet-joinende call als de TV gebruikt
  // (TO §6): voegt de connectie toe aan de spelgroep zonder een speler aan te maken.
  useEffect(() => {
    if (!connection || connectionState !== HubConnectionState.Connected || playerId) return

    let cancelled = false

    connection
      .invoke<GameStateDto>('WatchGame', gameId)
      .then((fresh) => {
        if (!cancelled) applyState(fresh)
      })
      .catch(() => {
        // Onbekend spel o.i.d. — de join-stap toont zijn eigen foutmelding zodra de
        // speler daadwerkelijk JoinGame aanroept, hier niets tonen.
      })

    return () => {
      cancelled = true
    }
  }, [connection, connectionState, gameId, playerId])

  // Statische territoriumcatalogus (continent per gebied) — eenmalig per gameId, los van de
  // realtime state-stroom: verandert nooit tijdens een spel, dus geen reden om 'm via SignalR
  // mee te laten lopen (RiskGame.Api/Endpoints/GameEndpoints.cs).
  useEffect(() => {
    let cancelled = false

    fetch(`/games/${gameId}/territories`)
      .then((response) => (response.ok ? (response.json() as Promise<TerritoryCatalogDto[]>) : []))
      .then((catalog) => {
        if (!cancelled) setTerritoryCatalog(catalog)
      })
      .catch(() => {
        // Kaartlaag toont zelf geen fout op basis hiervan; de claim-/plaatsingsstap blijft dan
        // gewoon leeg totdat het endpoint weer bereikbaar is.
      })

    return () => {
      cancelled = true
    }
  }, [gameId])

  // Herstelt group-membership na elke (re)connect zodra er een bekende playerId is —
  // dekt zowel automatic-reconnect als een page refresh met sessionStorage-hit.
  useEffect(() => {
    if (!connection || connectionState !== HubConnectionState.Connected || !playerId) return

    let cancelled = false

    connection
      .invoke<GameStateDto>('RejoinGame', gameId, playerId)
      .then((fresh) => {
        if (!cancelled) {
          applyState(fresh)
          setError(null)
        }
      })
      .catch((rejoinError: unknown) => {
        if (!cancelled) {
          const message = rejoinError instanceof Error ? rejoinError.message : String(rejoinError)
          setError(translateValidationErrors(parseHubError(message)))
        }
      })

    return () => {
      cancelled = true
    }
  }, [connection, connectionState, gameId, playerId])

  const invoke = useCallback(
    async <T,>(methodName: string, ...args: unknown[]): Promise<T | undefined> => {
      if (!connection) return undefined

      try {
        setError(null)

        return await connection.invoke<T>(methodName, ...args)
      } catch (invokeError) {
        const message = invokeError instanceof Error ? invokeError.message : String(invokeError)
        setError(translateValidationErrors(parseHubError(message)))

        return undefined
      }
    },
    [connection],
  )

  const chooseColor = useCallback(
    async (colorId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('ChooseColor', gameId, playerId, colorId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  // Eén gebruikersactie (de samengevoegde naam+kleur-stap) die twee hub-calls na
  // elkaar doet. Gebruikt de playerId uit de JoinGame-respons rechtstreeks voor
  // ChooseColor — playerId-state uit persistPlayerId is op dat moment nog niet
  // doorgevoerd (React-state-update ligt na deze await), dus lezen uit closure-
  // state zou hier een stale null opleveren.
  const joinGameWithColor = useCallback(
    async (playerName: string, colorId: string) => {
      const joined = await invoke<JoinGameResponse>('JoinGame', gameId, playerName)

      if (!joined) return

      persistPlayerId(joined.playerId)
      applyState(joined.state)

      const updated = await invoke<GameStateDto>('ChooseColor', gameId, joined.playerId, colorId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, persistPlayerId],
  )

  const removePlayer = useCallback(
    async (targetPlayerId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('RemovePlayer', gameId, playerId, targetPlayerId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  const selectRole = useCallback(
    async (roleId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('SelectRole', gameId, playerId, roleId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  const startGame = useCallback(async () => {
    if (!playerId) return

    const updated = await invoke<GameStateDto>('StartGame', gameId, playerId)

    if (updated) applyState(updated)
  }, [invoke, gameId, playerId])

  const rollForOrder = useCallback(async () => {
    if (!playerId) return

    const response = await invoke<OrderRollResponse>('RollForOrder', gameId, playerId)

    if (response) applyState(response.state)
  }, [invoke, gameId, playerId])

  const claimTerritory = useCallback(
    async (territoryId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('ClaimTerritory', gameId, playerId, territoryId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  const placeInitialArmy = useCallback(
    async (territoryId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('PlaceInitialArmy', gameId, playerId, territoryId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  return {
    state,
    playerId,
    connectionState,
    error,
    orderRollThrows,
    territoryCatalog,
    joinGameWithColor,
    chooseColor,
    removePlayer,
    selectRole,
    startGame,
    rollForOrder,
    claimTerritory,
    placeInitialArmy,
  }
}