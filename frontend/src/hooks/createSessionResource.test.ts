import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createSessionResource } from './createSessionResource'

describe('createSessionResource', () => {
  it('start in loading-status en levert daarna de data', async () => {
    const useResource = createSessionResource(() => Promise.resolve('kaart'))

    const { result } = renderHook(() => useResource())

    expect(result.current).toEqual({ data: null, loading: true, error: false })
    await waitFor(() => expect(result.current).toEqual({ data: 'kaart', loading: false, error: false }))
  })

  it('laadt hoogstens één keer, ook bij gelijktijdige en latere mounts', async () => {
    const load = vi.fn(() => Promise.resolve('kaart'))
    const useResource = createSessionResource(load)

    const first = renderHook(() => useResource())
    const concurrent = renderHook(() => useResource())
    await waitFor(() => expect(first.result.current.data).toBe('kaart'))
    await waitFor(() => expect(concurrent.result.current.data).toBe('kaart'))

    const later = renderHook(() => useResource())

    expect(later.result.current.data).toBe('kaart')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('zet error bij een mislukte load en probeert het bij de volgende mount opnieuw', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('kaart')
    const useResource = createSessionResource(load)

    const failed = renderHook(() => useResource())
    await waitFor(() => expect(failed.result.current).toEqual({ data: null, loading: false, error: true }))

    const retried = renderHook(() => useResource())
    await waitFor(() => expect(retried.result.current.data).toBe('kaart'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('houdt de cache per aangemaakte hook gescheiden', async () => {
    const useA = createSessionResource(() => Promise.resolve('a'))
    const useB = createSessionResource(() => Promise.resolve('b'))

    const a = renderHook(() => useA())
    const b = renderHook(() => useB())

    await waitFor(() => expect(a.result.current.data).toBe('a'))
    await waitFor(() => expect(b.result.current.data).toBe('b'))
  })
})
