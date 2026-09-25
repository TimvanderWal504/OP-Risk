import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { useTvPairing } from './useTvPairing'
import { useSignalR } from './useSignalR'
import type { TvPairedMessage } from '../types/HubResponses'

vi.mock('./useSignalR', () => ({ useSignalR: vi.fn() }))

function createFakeConnection(codes: string[]) {
  const handlers = new Map<string, ((message: never) => void)[]>()
  const invoke = vi.fn(() => Promise.resolve(codes.shift()))

  const connection = {
    invoke,
    on: (event: string, handler: (message: never) => void) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler])
    },
    off: (event: string, handler: (message: never) => void) => {
      handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== handler))
    },
  } as unknown as HubConnection

  const emit = <T,>(event: string, message: T) => {
    for (const handler of handlers.get(event) ?? []) handler(message as never)
  }

  return { connection, invoke, emit }
}

function mockHub(connection: HubConnection, connectionState: HubConnectionState) {
  vi.mocked(useSignalR).mockReturnValue({ connection, connectionState })
}

describe('useTvPairing', () => {
  it('vraagt een koppelcode aan zodra de verbinding open is', async () => {
    const { connection, invoke } = createFakeConnection(['K7M2PQ'])
    mockHub(connection, HubConnectionState.Connected)

    const { result } = renderHook(() => useTvPairing())

    await waitFor(() => expect(result.current.pairingCode).toBe('K7M2PQ'))
    expect(invoke).toHaveBeenCalledWith('RegisterTv')
  })

  it('toont geen code zolang de verbinding niet open is', () => {
    const { connection, invoke } = createFakeConnection(['K7M2PQ'])
    mockHub(connection, HubConnectionState.Connecting)

    const { result } = renderHook(() => useTvPairing())

    expect(result.current.pairingCode).toBeNull()
    expect(invoke).not.toHaveBeenCalled()
  })

  it('vraagt na een reconnect een nieuwe code aan', async () => {
    const { connection } = createFakeConnection(['EERSTE', 'TWEEDE'])
    mockHub(connection, HubConnectionState.Connected)
    const { result, rerender } = renderHook(() => useTvPairing())
    await waitFor(() => expect(result.current.pairingCode).toBe('EERSTE'))

    mockHub(connection, HubConnectionState.Reconnecting)
    rerender()
    expect(result.current.pairingCode).toBeNull()

    mockHub(connection, HubConnectionState.Connected)
    rerender()
    await waitFor(() => expect(result.current.pairingCode).toBe('TWEEDE'))
  })

  it('levert de spelcode die de host naar deze TV stuurt', async () => {
    const { connection, emit } = createFakeConnection(['K7M2PQ'])
    mockHub(connection, HubConnectionState.Connected)
    const { result } = renderHook(() => useTvPairing())
    await waitFor(() => expect(result.current.pairingCode).toBe('K7M2PQ'))

    act(() => emit<TvPairedMessage>('TvPaired', { gameId: 'ATLAS7' }))

    expect(result.current.pairedGameId).toBe('ATLAS7')
  })

  it('meldt een mislukte aanvraag', async () => {
    const { connection, invoke } = createFakeConnection([])
    invoke.mockReturnValueOnce(Promise.reject(new Error('boom')))
    mockHub(connection, HubConnectionState.Connected)

    const { result } = renderHook(() => useTvPairing())

    await waitFor(() => expect(result.current.failed).toBe(true))
  })
})
