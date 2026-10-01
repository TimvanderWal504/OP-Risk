import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { useGameState } from './useGameState'
import { useSignalR } from './useSignalR'
import { ToastProvider } from './ToastProvider'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'

vi.mock('./useSignalR', () => ({ useSignalR: vi.fn() }))

const withToasts = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device: 'phone', children })

/**
 * De herverbinding (TO §6.3) en "Ik ben terug" (DESIGN.md § Auto-pass) delen dezelfde `RejoinGame`-
 * aanroep. Deze test bewaakt dat het ombouwen tot een aanroepbare `rejoin()` het automatische pad niet
 * raakte: een verbonden telefoon met een bekende speler meldt zich nog steeds vanzelf aan.
 */
describe('useGameState — opnieuw aanmelden', () => {
  beforeEach(() => {
    sessionStorage.setItem('game:ABCD:playerId', 'alice')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'))
  })

  afterEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  function connect() {
    const invoke = vi.fn((method: string) => Promise.resolve(method === 'RejoinGame' ? fixtureState : undefined))
    const connection = { invoke, on: vi.fn(), off: vi.fn() } as unknown as HubConnection
    vi.mocked(useSignalR).mockReturnValue({ connection, connectionState: HubConnectionState.Connected })

    return invoke
  }

  it('meldt een verbonden telefoon met een bekende speler vanzelf opnieuw aan', async () => {
    const invoke = connect()

    renderHook(() => useGameState('ABCD'), { wrapper: withToasts })

    await waitFor(() => expect(invoke).toHaveBeenCalledWith('RejoinGame', 'ABCD', 'alice', ''))
  })

  it('meldt opnieuw aan op verzoek ("Ik ben terug")', async () => {
    const invoke = connect()
    const { result } = renderHook(() => useGameState('ABCD'), { wrapper: withToasts })
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1))

    await act(() => result.current.rejoin())

    expect(invoke.mock.calls.filter(([method]) => method === 'RejoinGame')).toHaveLength(2)
  })
})
