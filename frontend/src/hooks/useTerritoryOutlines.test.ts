import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const featureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      properties: { id: 'ukraine', continent: 'europe', centroid: [-180, 90] },
      geometry: { type: 'Polygon', coordinates: [[[-180, 90], [191, 90]]] },
    },
  ],
}

// `useTerritoryOutlines` cachet in module-scope state — elke test importeert de module daarom
// vers via `vi.resetModules()`, anders lekt de cache van de ene test naar de andere.
async function importFreshHook() {
  vi.resetModules()
  const module = await import('./useTerritoryOutlines')
  return module.useTerritoryOutlines
}

describe('useTerritoryOutlines', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('start met null en levert daarna de genormaliseerde omlijningen, lazy pas bij de eerste render', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(featureCollection),
    })
    vi.stubGlobal('fetch', fetchMock)
    const useTerritoryOutlines = await importFreshHook()

    expect(fetchMock).not.toHaveBeenCalled()

    const { result } = renderHook(() => useTerritoryOutlines())

    expect(result.current).toBeNull()

    await waitFor(() => expect(result.current).not.toBeNull())

    expect(result.current?.ukraine.viewBox).toBe('0 0 64 64')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('een tweede hook-instantie hergebruikt de module-scope cache zonder opnieuw te fetchen', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(featureCollection),
    })
    vi.stubGlobal('fetch', fetchMock)
    const useTerritoryOutlines = await importFreshHook()

    const first = renderHook(() => useTerritoryOutlines())
    await waitFor(() => expect(first.result.current).not.toBeNull())

    const second = renderHook(() => useTerritoryOutlines())

    expect(second.result.current).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('blijft null als het ophalen mislukt, geen foutstaat', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve(undefined) }),
    )
    const useTerritoryOutlines = await importFreshHook()

    const { result } = renderHook(() => useTerritoryOutlines())

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(result.current).toBeNull()
  })
})
