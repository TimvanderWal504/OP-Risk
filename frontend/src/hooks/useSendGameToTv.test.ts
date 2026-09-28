import { createElement, type ReactNode } from 'react'
import { act, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { useSendGameToTv } from './useSendGameToTv'
import { useSignalR } from './useSignalR'
import { ToastProvider } from './ToastProvider'

vi.mock('./useSignalR', () => ({ useSignalR: vi.fn() }))

function mockInvoke(invoke: () => Promise<unknown>) {
  const connection = { invoke: vi.fn(invoke) } as unknown as HubConnection
  vi.mocked(useSignalR).mockReturnValue({ connection, connectionState: HubConnectionState.Connected })

  return connection
}

const withToasts = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device: 'phone', children })

describe('useSendGameToTv', () => {
  it('stuurt koppelcode en spelcode naar de hub', async () => {
    const connection = mockInvoke(() => Promise.resolve())
    const { result } = renderHook(() => useSendGameToTv(), { wrapper: withToasts })

    let accepted = false
    await act(async () => {
      accepted = await result.current.send('K7M2PQ', 'ATLAS7')
    })

    expect(accepted).toBe(true)
    expect(connection.invoke).toHaveBeenCalledWith('SendGameToTv', 'K7M2PQ', 'ATLAS7')
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('toont een geweigerde koppelcode vertaald als toast', async () => {
    mockInvoke(() => Promise.reject(new Error(JSON.stringify([{ code: 'tvPairing.unknownCode' }]))))
    const { result } = renderHook(() => useSendGameToTv(), { wrapper: withToasts })

    let accepted = true
    await act(async () => {
      accepted = await result.current.send('K7M2PQ', 'ATLAS7')
    })

    expect(accepted).toBe(false)
    expect(screen.getByRole('alert')).toHaveTextContent('Deze TV is niet meer beschikbaar. Scan de QR-code op de TV opnieuw.')
  })
})
