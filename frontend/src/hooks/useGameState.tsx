import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HubConnectionState } from '@microsoft/signalr'
import { useSignalR } from './useSignalR'
import { useToast } from './useToast'
import { useEventDrawNotice } from './useEventDrawNotice'
import { useHostTransferNotice } from './useHostTransferNotice'
import { useReportOnce } from './useReportOnce'
import { ActionLogOfflineError } from './useActionLog'
import { useCombatBroadcast } from './useCombatBroadcast'
import { useTurnCombat } from './useTurnCombat'
import { GamePhaseDto, type GameStateDto, type RecentActionDto } from '../types/GameState'
import type {
  CombatResultResponse,
  DeclareAttackResponse,
  DiceRolledMessage,
  JoinGameResponse,
  OrderRollResponse,
  RerollAttackDieResponse,
} from '../types/HubResponses'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import type { TvDisplaySettingsDto } from '../types/TvDisplay'
import { parseHubError, translateValidationErrors } from '../i18n/hubError'
import { rememberTvDisplay } from '../storage/rememberedTvDisplay'
import { apiUrl } from '../config/apiConfig'

const playerIdKey = (gameId: string) => `game:${gameId}:playerId`
const sessionTokenKey = (gameId: string) => `game:${gameId}:sessionToken`
// Toastbron van alle hub-fouten: een nieuwe hub-aanroep ruimt de fout van de vorige op, zoals de
// footer-foutregel die de toast vervangt dat deed.
const hubToastSource = 'hub'

function hubErrorMessage(hubError: unknown): string {
  const message = hubError instanceof Error ? hubError.message : String(hubError)

  return translateValidationErrors(parseHubError(message))
}

/**
 * Speler-kant van de lobby-flow (telefoon, FO §3): join/kleur/rol/start via de hub,
 * geabonneerd op "GameStateUpdated" zodat acties van andere spelers direct doorkomen.
 * Toont nooit voorspelde state — alleen wat de server bevestigt (frontend/CLAUDE.md).
 *
 * playerId wordt in sessionStorage bewaard en na elke (re)connect via RejoinGame
 * teruggemeld aan de hub, want SignalR-groepslidmaatschap gaat verloren bij reconnect
 * én bij page refresh (nieuwe connection-id in beide gevallen). sessionToken (TO §6.3,
 * ontvangen bij JoinGame) gaat in dezelfde RejoinGame-aanroep mee: zonder dat token
 * degradeert de hub naar de publieke weergave — met een geldig token krijgt deze speler
 * z'n eigen Hand/MissionId weer terug (zie GameHub.RejoinGame).
 */
export function useGameState(gameId: string) {
  const { connection, connectionState } = useSignalR()
  const [state, setState] = useState<GameStateDto | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(
    () => sessionStorage.getItem(playerIdKey(gameId)),
  )
  const { showError, clearSource } = useToast()
  const [orderRollThrows, setOrderRollThrows] = useState<Record<string, number[]>>({})
  // Telt op bij elk "Verder op TV"-seintje van de host (FO §2.2); de houd-hooks laten dan los.
  const [skipSignal, setSkipSignal] = useState(0)
  // `null` tot het laden gelukt is — anders valt "nog niet geladen" niet te onderscheiden van een
  // lege catalogus, en zou een mislukte load nooit opnieuw geprobeerd worden.
  const [territoryCatalog, setTerritoryCatalog] = useState<TerritoryCatalogDto[] | null>(null)
  const catalogReport = useReportOnce('territoryCatalog')
  const { t } = useTranslation('common')

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

    // "Verder op TV" (FO §2.2): ook de telefoon houdt de volgorde-uitslag vast en laat die los.
    const onHoldsSkipped = () => setSkipSignal((current) => current + 1)

    connection.on('GameStateUpdated', onUpdate)
    connection.on('DiceRolled', onDiceRolled)
    connection.on('HoldsSkipped', onHoldsSkipped)

    return () => {
      connection.off('GameStateUpdated', onUpdate)
      connection.off('DiceRolled', onDiceRolled)
      connection.off('HoldsSkipped', onHoldsSkipped)
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
        // Onbekend spel o.i.d. — JoinGame geeft dezelfde fout als toast zodra de speler
        // deelneemt; hier ook een toast tonen zou 'm dubbel laten verschijnen.
      })

    return () => {
      cancelled = true
    }
  }, [connection, connectionState, gameId, playerId])

  // Statische territoriumcatalogus (continent per gebied) — eenmalig per gameId, los van de
  // realtime state-stroom: verandert nooit tijdens een spel, dus geen reden om 'm via SignalR
  // mee te laten lopen (RiskGame.Api/Endpoints/GameEndpoints.cs).
  //
  // Mislukt het laden, dan wordt dat één keer een toast en probeert het effect het stil opnieuw
  // bij elke nieuwe state (`stateVersion`) — niet per fase: `phase` blijft het hele spel
  // `InProgress`, dus een fout midden in het spel zou dan tot een refresh blijven hangen.
  const catalogLoaded = territoryCatalog !== null
  const stateVersion = state?.stateVersion

  useEffect(() => {
    if (catalogLoaded) return

    let cancelled = false

    fetch(apiUrl(`/games/${gameId}/territories`))
      .then((response) => {
        if (!response.ok) throw new Error(`GET /games/${gameId}/territories: ${response.status}`)

        return response.json() as Promise<TerritoryCatalogDto[]>
      })
      .then((catalog) => {
        if (cancelled) return
        setTerritoryCatalog(catalog)
        catalogReport.resolved()
      })
      .catch(() => {
        if (!cancelled) catalogReport.report(t('loadErrors.territories'))
      })

    return () => {
      cancelled = true
    }
  }, [gameId, catalogLoaded, stateVersion, catalogReport, t])

  // Opnieuw melden bij het spel met het eigen sessietoken. Herstelt de group-membership en haalt
  // de speler van auto-pass af (FO §11.2) — gedeeld door de effect hieronder en "Ik ben terug".
  const requestRejoin = useCallback(
    (): Promise<GameStateDto> =>
      connection!.invoke<GameStateDto>('RejoinGame', gameId, playerId!, sessionStorage.getItem(sessionTokenKey(gameId)) ?? ''),
    [connection, gameId, playerId],
  )

  // Herstelt group-membership na elke (re)connect zodra er een bekende playerId is —
  // dekt zowel automatic-reconnect als een page refresh met sessionStorage-hit.
  useEffect(() => {
    if (!connection || connectionState !== HubConnectionState.Connected || !playerId) return

    let cancelled = false

    requestRejoin()
      .then((fresh) => {
        if (!cancelled) {
          applyState(fresh)
          clearSource(hubToastSource)
        }
      })
      .catch((rejoinError: unknown) => {
        if (!cancelled) showError(hubErrorMessage(rejoinError), hubToastSource)
      })

    return () => {
      cancelled = true
    }
  }, [connection, connectionState, playerId, requestRejoin, showError, clearSource])

  /**
   * "Ik ben terug" (DESIGN.md § Auto-pass): dezelfde herverbinding als hierboven, op verzoek. Zonder
   * verbinding doet dit bewust niets: zodra de verbinding terugkomt, meldt de effect hierboven de
   * speler vanzelf opnieuw aan en vervalt auto-pass alsnog — de app toont het ontbreken van een
   * verbinding al zelf.
   */
  const rejoin = useCallback(async () => {
    if (!connection || connectionState !== HubConnectionState.Connected || !playerId) return

    try {
      applyState(await requestRejoin())
      clearSource(hubToastSource)
    } catch (rejoinError: unknown) {
      showError(hubErrorMessage(rejoinError), hubToastSource)
    }
  }, [connection, connectionState, playerId, requestRejoin, showError, clearSource])

  const invoke = useCallback(
    async <T,>(methodName: string, ...args: unknown[]): Promise<T | undefined> => {
      if (!connection) return undefined

      try {
        clearSource(hubToastSource)

        return await connection.invoke<T>(methodName, ...args)
      } catch (invokeError) {
        showError(hubErrorMessage(invokeError), hubToastSource)

        return undefined
      }
    },
    [connection, showError, clearSource],
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
      sessionStorage.setItem(sessionTokenKey(gameId), joined.sessionToken)
      applyState(joined.state)

      const updated = await invoke<GameStateDto>('ChooseColor', gameId, joined.playerId, colorId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, persistPlayerId],
  )

  // Een speler neemt zijn plek over op dit tabblad (TO §6.3, `RejoinAsPlayer`). Anders dan bij een
  // join verandert de spelstate hier niet: de respons heeft dezelfde `stateVersion` als de publieke
  // state die `WatchGame` al leverde, en `applyState` zou 'm dan als "niet nieuwer" negeren — precies
  // de eigen Hand/MissionId die dit antwoord toevoegt. Daarom een gelijke versie wél doorlaten.
  const reclaimPlayer = useCallback(
    async (playerName: string) => {
      const reclaimed = await invoke<JoinGameResponse>('RejoinAsPlayer', gameId, playerName)

      if (!reclaimed) return

      sessionStorage.setItem(sessionTokenKey(gameId), reclaimed.sessionToken)
      persistPlayerId(reclaimed.playerId)
      setState((current) =>
        current && reclaimed.state.stateVersion < current.stateVersion ? current : reclaimed.state,
      )
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

  const placeReinforcements = useCallback(
    async (territoryId: string, amount: number) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('PlaceReinforcements', gameId, playerId, territoryId, amount)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  const tradeInCards = useCallback(
    async (cardIds: string[]) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('TradeInCards', gameId, playerId, cardIds)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  const endPhase = useCallback(async () => {
    if (!playerId) return

    const updated = await invoke<GameStateDto>('EndPhase', gameId, playerId)

    if (updated) applyState(updated)
  }, [invoke, gameId, playerId])

  /** "Verder op TV" (FO §2.2), alleen de host: laat de wachttijden op TV en telefoons eindigen. */
  const skipTvHold = useCallback(async () => {
    if (!playerId) return

    await invoke('SkipTvHold', gameId, playerId)
  }, [invoke, gameId, playerId])

  /** De host zet een andere speler op auto-pass (FO §11.2); de server valideert opnieuw. */
  const setAutoPass = useCallback(
    async (targetPlayerId: string) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('SetAutoPass', gameId, playerId, targetPlayerId)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  /** "Legers verwijderen" (FO §9.2): gebied → aantal áfgestane legers; de server valideert opnieuw. */
  const removeArmies = useCallback(
    async (removalsByTerritory: Record<string, number>) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('RemoveArmies', gameId, playerId, removalsByTerritory)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  // De aanvaller krijgt zijn eigen worp ook via de "attack"-broadcast (dezelfde group als de
  // caller), dus geen los retourwaarde-pad nodig — zelfde fire-and-forget-patroon als
  // `placeReinforcements`. `combat` (hieronder) draagt de weergavedata voor zowel aanvaller als
  // verdediger.
  const declareAttack = useCallback(
    // `true` als de server de aanval aannam; bij een weigering (al als toast gemeld) blijft de
    // aanvaller op het dobbelsteenscherm in plaats van op een gevecht te wachten dat niet komt.
    async (fromTerritoryId: string, toTerritoryId: string, attackDice: number): Promise<boolean> => {
      if (!playerId) return false

      const response = await invoke<DeclareAttackResponse>(
        'DeclareAttack',
        gameId,
        playerId,
        fromTerritoryId,
        toTerritoryId,
        attackDice,
      )

      if (!response) return false

      applyState(response.state)

      return true
    },
    [invoke, gameId, playerId],
  )

  // In tegenstelling tot de andere acties hier géén fire-and-forget: `DefendStep` toont het
  // volledige gevechtsresultaat rechtstreeks uit deze respons (geen `CombatNarrated`-broadcast
  // nodig voor de verdediger zelf — zie het Attack-bouwplan).
  const chooseDefenseDice = useCallback(
    async (defenseDice: number, useDefenseBoost = false): Promise<CombatResultResponse | undefined> => {
      if (!playerId) return undefined

      const response = await invoke<CombatResultResponse>(
        'ChooseDefenseDice',
        gameId,
        playerId,
        defenseDice,
        useDefenseBoost,
      )

      if (response) applyState(response.state)

      return response
    },
    [invoke, gameId, playerId],
  )

  const moveAfterConquest = useCallback(
    async (armiesToMove: number) => {
      if (!playerId) return

      const updated = await invoke<GameStateDto>('MoveAfterConquest', gameId, playerId, armiesToMove)

      if (updated) applyState(updated)
    },
    [invoke, gameId, playerId],
  )

  // "Ander gevecht" (FO §5.4): stopt de belegering van het huidige doelwit handmatig, zodat de
  // beurttimer meteen hervat i.p.v. pas bij een volgende `DeclareAttack` — zie AttackCommandHandler.
  const abandonAttack = useCallback(async () => {
    if (!playerId) return

    const updated = await invoke<GameStateDto>('AbandonAttack', gameId, playerId)

    if (updated) applyState(updated)
  }, [invoke, gameId, playerId])

  // Rol-herwerp (FO §8.1, plan-rollen taak 5): fire-and-forget zoals `declareAttack` — de
  // aanvaller ziet de nieuwe worp ook via de "reroll"-`DiceRolled`-broadcast (`combat`), en de
  // bijgewerkte `PendingCombatDto` komt gewoon mee in deze respons.
  const rerollAttackDie = useCallback(
    async (dieIndex: number) => {
      if (!playerId) return

      const response = await invoke<RerollAttackDieResponse>('RerollAttackDie', gameId, playerId, dieIndex)

      if (response) applyState(response.state)
    },
    [invoke, gameId, playerId],
  )

  // "Doorgaan" (FO §8.1, plan-rollen A8): sluit de herwerp-beslissing zonder te herwerpen.
  const keepAttackDice = useCallback(async () => {
    if (!playerId) return

    const updated = await invoke<GameStateDto>('KeepAttackDice', gameId, playerId)

    if (updated) applyState(updated)
  }, [invoke, gameId, playerId])

  // Anders dan de fire-and-forget-acties hierboven: `FortifyFlowStep` moet synchroon weten of de
  // aanroep lukte om te beslissen of ze op de huidige stap moet blijven staan (i.p.v. door te gaan
  // naar de volgende stap) — vandaar `Promise<boolean>` i.p.v. `Promise<void>`. `invoke` vangt elke
  // fout zelf af (als toast) en geeft dan `undefined` terug (nooit een reject), dus dit hoeft geen eigen
  // try/catch te hebben.
  const fortify = useCallback(
    async (fromTerritoryId: string, toTerritoryId: string, armiesToMove: number): Promise<boolean> => {
      if (!playerId) return false

      const updated = await invoke<GameStateDto>('Fortify', gameId, playerId, fromTerritoryId, toTerritoryId, armiesToMove)

      if (updated) applyState(updated)

      return updated !== undefined
    },
    [invoke, gameId, playerId],
  )

  const endTurn = useCallback(async (): Promise<boolean> => {
    if (!playerId) return false

    const updated = await invoke<GameStateDto>('EndTurn', gameId, playerId)

    if (updated) applyState(updated)

    return updated !== undefined
  }, [invoke, gameId, playerId])

  // TV-weergave (plan-testronde-tv punt 2), alleen de host. Na bevestiging onthoudt deze telefoon
  // de waarden voor een volgend spel — de server-respons, niet de invoer. `Promise<boolean>`
  // (zelfde reden als `fortify`): het paneel moet bij een weigering zijn slider terugzetten en
  // zijn basis voor een volgende wijziging loslaten.
  const setTvDisplay = useCallback(
    async (settings: TvDisplaySettingsDto): Promise<boolean> => {
      if (!playerId) return false

      const updated = await invoke<GameStateDto>(
        'SetTvDisplay',
        gameId,
        playerId,
        settings.textScale,
        settings.glassOpacity,
        settings.glassBlur,
        settings.language,
        settings.diceScale,
      )

      if (updated) {
        applyState(updated)
        rememberTvDisplay(updated.tvDisplay)
      }

      return updated !== undefined
    },
    [invoke, gameId, playerId],
  )

  // Het volledige verloop voor het tabblad Spelverloop (besluit gebruiker 2026-09-26): los van de
  // state, die er maar een paar meestuurt. Bewust niet via `invoke`: een mislukte leesactie meldt
  // het tabblad zelf (één toast met een eigen bron, `GameInfoHistory`), niet als hub-fout.
  // Zonder verbinding een `ActionLogOfflineError`: dat meldt het tabblad niet, en omdat
  // `connectionState` in de deps zit, laadt het na het herstel vanzelf opnieuw.
  const loadActionLog = useCallback(async (): Promise<RecentActionDto[]> => {
    if (!connection || connectionState !== HubConnectionState.Connected) throw new ActionLogOfflineError()

    return connection.invoke<RecentActionDto[]>('GetActionLog', gameId)
  }, [connection, connectionState, gameId])

  const combat = useTurnCombat(useCombatBroadcast(connection), state?.turnState?.activePlayerId ?? null)

  // Korte melding bij elke getrokken gebeurteniskaart (FO §9.2) — hier, naast de fouttoasts van
  // de telefoon, zodat elke telefoonroute hem krijgt.
  useEventDrawNotice(state, playerId)
  useHostTransferNotice(state, playerId)

  return {
    state,
    playerId,
    connectionState,
    orderRollThrows,
    territoryCatalog: territoryCatalog ?? [],
    combat,
    joinGameWithColor,
    reclaimPlayer,
    chooseColor,
    removePlayer,
    selectRole,
    startGame,
    rollForOrder,
    claimTerritory,
    placeInitialArmy,
    placeReinforcements,
    tradeInCards,
    declareAttack,
    chooseDefenseDice,
    moveAfterConquest,
    abandonAttack,
    rerollAttackDie,
    keepAttackDice,
    endPhase,
    removeArmies,
    setAutoPass,
    rejoin,
    skipTvHold,
    skipSignal,
    fortify,
    endTurn,
    setTvDisplay,
    loadActionLog,
  }
}