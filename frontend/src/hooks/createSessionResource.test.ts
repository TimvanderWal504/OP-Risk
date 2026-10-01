import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createSessionResource } from './createSessionResource'

describe('createSessionResource', () => {
  it('start in loading-status en levert daarna de data', async () => {
    const useResource = createSessionResource(() => Promise.resolve('kaart'))

    const { result } = renderHook(() => useResource('standaard-43'))

    expect(result.current).toEqual({ data: null, loading: true, error: false })
    await waitFor(() => expect(result.current).toEqual({ data: 'kaart', loading: false, error: false }))
  })

  it('laadt hoogstens één keer per sleutel, ook bij gelijktijdige en latere mounts', async () => {
    const load = vi.fn(() => Promise.resolve('kaart'))
    const useResource = createSessionResource(load)

    const first = renderHook(() => useResource('standaard-43'))
    const concurrent = renderHook(() => useResource('standaard-43'))
    await waitFor(() => expect(first.result.current.data).toBe('kaart'))
    await waitFor(() => expect(concurrent.result.current.data).toBe('kaart'))

    const later = renderHook(() => useResource('standaard-43'))

    expect(later.result.current.data).toBe('kaart')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('laadt elke sleutel apart en geeft per sleutel zijn eigen data', async () => {
    const load = vi.fn((key: string) => Promise.resolve(`kaart ${key}`))
    const useResource = createSessionResource(load)

    const standaard = renderHook(() => useResource('standaard-43'))
    const wereld = renderHook(() => useResource('wereld-49'))

    await waitFor(() => expect(standaard.result.current.data).toBe('kaart standaard-43'))
    await waitFor(() => expect(wereld.result.current.data).toBe('kaart wereld-49'))
    expect(load).toHaveBeenCalledWith('standaard-43')
    expect(load).toHaveBeenCalledWith('wereld-49')
  })

  it('toont bij een sleutelwissel nooit de data van de vorige sleutel', async () => {
    let resolveWereld: (value: string) => void = () => {}
    const load = vi.fn((key: string) =>
      key === 'wereld-49' ? new Promise<string>((resolve) => (resolveWereld = resolve)) : Promise.resolve('oud'),
    )
    const useResource = createSessionResource(load)

    const { result, rerender } = renderHook(({ key }) => useResource(key), { initialProps: { key: 'standaard-43' } })
    await waitFor(() => expect(result.current.data).toBe('oud'))

    rerender({ key: 'wereld-49' })

    expect(result.current).toEqual({ data: null, loading: true, error: false })
    resolveWereld('nieuw')
    await waitFor(() => expect(result.current.data).toBe('nieuw'))
  })

  it('zet error bij een mislukte load en probeert het bij de volgende mount opnieuw', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('kaart')
    const useResource = createSessionResource(load)

    const failed = renderHook(() => useResource('standaard-43'))
    await waitFor(() => expect(failed.result.current).toEqual({ data: null, loading: false, error: true }))

    const retried = renderHook(() => useResource('standaard-43'))
    await waitFor(() => expect(retried.result.current.data).toBe('kaart'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('telt een falsy waarde als geladen, niet als nog bezig', async () => {
    const useResource = createSessionResource(() => Promise.resolve(0))

    const { result } = renderHook(() => useResource('standaard-43'))

    await waitFor(() => expect(result.current).toEqual({ data: 0, loading: false, error: false }))
  })

  it('houdt de cache per aangemaakte hook gescheiden', async () => {
    const useA = createSessionResource(() => Promise.resolve('a'))
    const useB = createSessionResource(() => Promise.resolve('b'))

    const a = renderHook(() => useA('standaard-43'))
    const b = renderHook(() => useB('standaard-43'))

    await waitFor(() => expect(a.result.current.data).toBe('a'))
    await waitFor(() => expect(b.result.current.data).toBe('b'))
  })
})
