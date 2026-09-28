import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useActionLog } from './useActionLog'
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

describe('useActionLog', () => {
  it('laadt het verloop bij het openen', async () => {
    const load = vi.fn().mockResolvedValue([action(2), action(1)])

    const { result } = renderHook(() => useActionLog(load, '2'))

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.actions.map((a) => a.sequence)).toEqual([2, 1])
  })

  it('laadt opnieuw als de bovenste regel verandert, met de vorige lijst zolang in beeld', async () => {
    const { load, pending } = controlledLoader()
    const { result, rerender } = renderHook(({ key }) => useActionLog(load, key), { initialProps: { key: '1' } })
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
    const { result, rerender } = renderHook(({ key }) => useActionLog(load, key), { initialProps: { key: '1' } })

    rerender({ key: '2' })
    pending[1].resolve([action(2), action(1)])
    await waitFor(() => expect(result.current.status).toBe('ready'))
    pending[0].resolve([action(1)])
    await Promise.resolve()

    expect(result.current.actions.map((a) => a.sequence)).toEqual([2, 1])
  })

  it('meldt een fout als het verloop niet te laden is', async () => {
    const load = vi.fn().mockRejectedValue(new Error('weg'))

    const { result } = renderHook(() => useActionLog(load, '1'))

    await waitFor(() => expect(result.current.status).toBe('error'))
  })
})
