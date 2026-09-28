import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionLogOfflineError, useActionLog } from './useActionLog'
import { RecentActionKindDto, type RecentActionDto } from '../types/GameState'

const action = (sequence: number): RecentActionDto => ({
  sequence,
  kind: RecentActionKindDto.CardsTraded,
  playerId: 'alice',
  otherPlayerId: null,
  territoryId: null,
  fromTerritoryId: null,
  amount: 4,
  total: null,
  attackerLosses: null,
  defenderLosses: null,
})

/** Een loader waarvan de test zelf bepaalt wanneer (en met wat) elk verzoek antwoordt. */
function controlledLoader() {
  const pending: { resolve: (actions: RecentActionDto[]) => void; reject: (error: Error) => void }[] = []
  const load = vi.fn(
    () =>
      new Promise<RecentActionDto[]>((resolve, reject) => {
        pending.push({ resolve, reject })
      }),
  )

  return { load, pending }
}

// Stabiele callbacks, zoals `useReportOnce` ze levert; nieuwe per test.
function callbacks() {
  return { onError: vi.fn(), onResolved: vi.fn() }
}

describe('useActionLog', () => {
  it('laadt het verloop bij het openen', async () => {
    const load = vi.fn().mockResolvedValue([action(2), action(1)])
    const { onError, onResolved } = callbacks()

    const { result } = renderHook(() => useActionLog(load, '2', onError, onResolved))

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.actions.map((a) => a.sequence)).toEqual([2, 1])
    expect(onResolved).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
  })

  it('laadt opnieuw als de bovenste regel verandert, met de vorige lijst zolang in beeld', async () => {
    const { load, pending } = controlledLoader()
    const { onError, onResolved } = callbacks()
    const { result, rerender } = renderHook(({ key }) => useActionLog(load, key, onError, onResolved), {
      initialProps: { key: '1' },
    })
    pending[0].resolve([action(1)])
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender({ key: '2' })

    expect(load).toHaveBeenCalledTimes(2)
    expect(result.current.actions.map((a) => a.sequence)).toEqual([1])
    pending[1].resolve([action(2), action(1)])
    await waitFor(() => expect(result.current.actions.map((a) => a.sequence)).toEqual([2, 1]))
  })

  it('negeert een antwoord dat binnenkomt nadat er al een nieuwer verzoek loopt', async () => {
    const { load, pending } = controlledLoader()
    const { onError, onResolved } = callbacks()
    const { result, rerender } = renderHook(({ key }) => useActionLog(load, key, onError, onResolved), {
      initialProps: { key: '1' },
    })

    rerender({ key: '2' })
    pending[1].resolve([action(2), action(1)])
    await waitFor(() => expect(result.current.status).toBe('ready'))
    pending[0].resolve([action(1)])
    await Promise.resolve()

    expect(result.current.actions.map((a) => a.sequence)).toEqual([2, 1])
  })

  it('meldt een fout via onError en is dan nog niet beschikbaar', async () => {
    const load = vi.fn().mockRejectedValue(new Error('weg'))
    const { onError, onResolved } = callbacks()

    const { result } = renderHook(() => useActionLog(load, '1', onError, onResolved))

    await waitFor(() => expect(result.current.status).toBe('unavailable'))
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onResolved).not.toHaveBeenCalled()
  })

  it('houdt bij een fout na een eerdere lijst die lijst in beeld', async () => {
    const { load, pending } = controlledLoader()
    const { onError, onResolved } = callbacks()
    const { result, rerender } = renderHook(({ key }) => useActionLog(load, key, onError, onResolved), {
      initialProps: { key: '1' },
    })
    pending[0].resolve([action(1)])
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender({ key: '2' })
    pending[1].reject(new Error('weg'))

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
    expect(result.current.status).toBe('ready')
    expect(result.current.actions.map((a) => a.sequence)).toEqual([1])
  })

  it('meldt niets zonder verbinding, en laadt opnieuw zodra load na het herstel verandert', async () => {
    const offline = vi.fn().mockRejectedValue(new ActionLogOfflineError())
    const online = vi.fn().mockResolvedValue([action(1)])
    const { onError, onResolved } = callbacks()
    const { result, rerender } = renderHook(({ load }) => useActionLog(load, '1', onError, onResolved), {
      initialProps: { load: offline },
    })

    await waitFor(() => expect(result.current.status).toBe('unavailable'))
    expect(onError).not.toHaveBeenCalled()

    rerender({ load: online })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.actions.map((a) => a.sequence)).toEqual([1])
  })
})
