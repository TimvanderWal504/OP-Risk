import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { useSendGameToTv } from './useSendGameToTv'
import { useSignalR } from './useSignalR'

vi.mock('./useSignalR', () => ({ useSignalR: vi.fn() }))

function mockInvoke(invoke: () => Promise<unknown>) {
  const connection = { invoke: vi.fn(invoke) } as unknown as HubConnection
  vi.mocked(useSignalR).mockReturnValue({ connection, connectionState: HubConnectionState.Connected })

  return connection
}

describe('useSendGameToTv', () => {
  it('stuurt koppelcode en spelcode naar de hub', async () => {
    const connection = mockInvoke(() => Promise.resolve())
    const { result } = renderHook(() => useSendGameToTv())

    let accepted = false
    await act(async () => {
      accepted = await result.current.send('K7M2PQ', 'ATLAS7')
    })

    expect(accepted).toBe(true)
    expect(connection.invoke).toHaveBeenCalledWith('SendGameToTv', 'K7M2PQ', 'ATLAS7')
    expect(result.current.error).toBeNull()
  })

  it('vertaalt een geweigerde koppelcode', async () => {
    mockInvoke(() => Promise.reject(new Error(JSON.stringify([{ code: 'tvPairing.unknownCode' }]))))
    const { result } = renderHook(() => useSendGameToTv())

    let accepted = true
    await act(async () => {
      accepted = await result.current.send('K7M2PQ', 'ATLAS7')
    })

    expect(accepted).toBe(false)
    expect(result.current.error).toBe('Deze TV is niet meer beschikbaar. Scan de QR-code op de TV opnieuw.')
  })
})
