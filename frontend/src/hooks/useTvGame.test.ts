import { createElement, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { useTvGame } from './useTvGame'
import { useSignalR } from './useSignalR'
import { useToastList } from './useToastList'
import { ToastProvider } from './ToastProvider'
import { RETRY_BASE_MS } from './retryBackoff'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'

vi.mock('./useSignalR', () => ({ useSignalR: vi.fn() }))

function mockWatchGame(results: (() => Promise<unknown>)[]) {
  const invoke = vi.fn(() => (results.shift() ?? (() => Promise.resolve(fixtureState)))())
  const connection = { invoke, on: vi.fn(), off: vi.fn() } as unknown as HubConnection
  vi.mocked(useSignalR).mockReturnValue({ connection, connectionState: HubConnectionState.Connected })

  return invoke
}

const hubError = (code: string) => () => Promise.reject(new Error(JSON.stringify([{ code, params: { gameId: 'ATLAS7' } }])))

function renderTvGame() {
  const wrapper = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device: 'tv', children })
  const { result } = renderHook(() => ({ game: useTvGame('ATLAS7'), toasts: useToastList().toasts }), { wrapper })

  return result
}

describe('useTvGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('markeert een onbekend spel als eindtoestand, zonder toast en zonder nieuwe poging', async () => {
    const invoke = mockWatchGame([hubError('common.unknownGame')])
    const result = renderTvGame()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(RETRY_BASE_MS * 4)
    })

    expect(result.current.game.unknownGame).toBe(true)
    expect(result.current.toasts).toEqual([])
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('meldt een tijdelijke fout één keer en probeert het zelf opnieuw tot het lukt', async () => {
    const invoke = mockWatchGame([hubError('common.somethingElse'), hubError('common.somethingElse')])
    const result = renderTvGame()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.game.state).toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(RETRY_BASE_MS)
    })
    expect(invoke).toHaveBeenCalledTimes(2)
    expect(result.current.toasts).toHaveLength(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(RETRY_BASE_MS * 2)
    })
    expect(invoke).toHaveBeenCalledTimes(3)
    expect(result.current.game.state?.gameId).toBe(fixtureState.gameId)
    expect(result.current.game.unknownGame).toBe(false)
    expect(result.current.toasts).toEqual([])
  })

  /** "Verder op TV" (FO §2.2): de naam moet exact overeenkomen met `IGameClient.HoldsSkipped` op de server. */
  it('telt elk "HoldsSkipped"-seintje van de host op in skipSignal', async () => {
    mockWatchGame([])
    const result = renderTvGame()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    const on = vi.mocked(useSignalR().connection!.on)
    const onHoldsSkipped = on.mock.calls.find(([name]) => name === 'HoldsSkipped')?.[1] as () => void
    expect(result.current.game.skipSignal).toBe(0)

    act(() => onHoldsSkipped())

    expect(result.current.game.skipSignal).toBe(1)
  })
})
