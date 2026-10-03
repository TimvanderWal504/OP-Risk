import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { useGameState } from './useGameState'
import { useSignalR } from './useSignalR'
import { ToastProvider } from './ToastProvider'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'
import type { GameStateDto } from '../types/GameState'

vi.mock('./useSignalR', () => ({ useSignalR: vi.fn() }))

const withToasts = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device: 'phone', children })

/**
 * Een speler neemt zijn plek over op een nieuw tabblad (TO §6.3, `RejoinAsPlayer`): playerId en nieuw
 * token komen in `sessionStorage`, en het antwoord met de eigen Hand vervangt de publieke state die
 * `WatchGame` leverde — ook al is de `stateVersion` gelijk.
 */
describe('useGameState — plek overnemen', () => {
  const publicState: GameStateDto = { ...fixtureState, stateVersion: 7 }
  const ownState: GameStateDto = { ...fixtureState, stateVersion: 7, players: fixtureState.players.map((player) => ({ ...player })) }

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'))
  })

  afterEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  function connect(reclaimResult: unknown) {
    const invoke = vi.fn((method: string) => {
      if (method === 'WatchGame') return Promise.resolve(publicState)
      if (method === 'RejoinAsPlayer') return reclaimResult instanceof Error ? Promise.reject(reclaimResult) : Promise.resolve(reclaimResult)
      if (method === 'RejoinGame') return Promise.resolve(ownState)

      return Promise.resolve(undefined)
    })
    const connection = { invoke, on: vi.fn(), off: vi.fn() } as unknown as HubConnection
    vi.mocked(useSignalR).mockReturnValue({ connection, connectionState: HubConnectionState.Connected })

    return invoke
  }

  it('bewaart playerId en nieuw token en laat de state met dezelfde versie door', async () => {
    const invoke = connect({ playerId: 'alice', state: ownState, sessionToken: 'nieuw-token' })
    const { result } = renderHook(() => useGameState('ABCD'), { wrapper: withToasts })
    await waitFor(() => expect(result.current.state).toEqual(publicState))

    await act(() => result.current.reclaimPlayer('Alice'))

    expect(invoke).toHaveBeenCalledWith('RejoinAsPlayer', 'ABCD', 'Alice')
    expect(sessionStorage.getItem('game:ABCD:playerId')).toBe('alice')
    expect(sessionStorage.getItem('game:ABCD:sessionToken')).toBe('nieuw-token')
    expect(result.current.playerId).toBe('alice')
    expect(result.current.state).toBe(ownState)
  })

  it('meldt zich daarna met het nieuwe token aan bij RejoinGame', async () => {
    const invoke = connect({ playerId: 'alice', state: ownState, sessionToken: 'nieuw-token' })
    const { result } = renderHook(() => useGameState('ABCD'), { wrapper: withToasts })
    await waitFor(() => expect(invoke).toHaveBeenCalledWith('WatchGame', 'ABCD'))

    await act(() => result.current.reclaimPlayer('Alice'))

    await waitFor(() => expect(invoke).toHaveBeenCalledWith('RejoinGame', 'ABCD', 'alice', 'nieuw-token'))
  })

  it('laat een nieuwere state die intussen binnenkwam staan', async () => {
    const newer: GameStateDto = { ...fixtureState, stateVersion: 9 }
    const invoke = connect({ playerId: 'alice', state: ownState, sessionToken: 'nieuw-token' })
    invoke.mockImplementation((method: string) =>
      Promise.resolve(method === 'WatchGame' ? newer : method === 'RejoinAsPlayer' ? { playerId: 'alice', state: ownState, sessionToken: 't' } : undefined),
    )
    const { result } = renderHook(() => useGameState('ABCD'), { wrapper: withToasts })
    await waitFor(() => expect(result.current.state?.stateVersion).toBe(9))

    await act(() => result.current.reclaimPlayer('Alice'))

    expect(result.current.state?.stateVersion).toBe(9)
  })

  it('bewaart niets wanneer de server de overname weigert', async () => {
    connect(new Error('{"errors":[{"code":"common.unknownPlayerName"}]}'))
    const { result } = renderHook(() => useGameState('ABCD'), { wrapper: withToasts })
    await waitFor(() => expect(result.current.state).toEqual(publicState))

    await act(() => result.current.reclaimPlayer('Niemand'))

    expect(result.current.playerId).toBeNull()
    expect(sessionStorage.getItem('game:ABCD:playerId')).toBeNull()
    expect(sessionStorage.getItem('game:ABCD:sessionToken')).toBeNull()
  })
})
