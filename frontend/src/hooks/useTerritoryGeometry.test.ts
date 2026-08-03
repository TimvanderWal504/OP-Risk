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

// `useTerritoryGeometry` cachet in module-scope state — elke test importeert de module
// daarom vers via `vi.resetModules()`, anders lekt de cache van de ene test naar de andere.
async function importFreshHook() {
  vi.resetModules()
  const module = await import('./useTerritoryGeometry')
  return module.useTerritoryGeometry
}

describe('useTerritoryGeometry', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('start in loading-status en levert daarna de geometrie', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(featureCollection),
    })
    vi.stubGlobal('fetch', fetchMock)
    const useTerritoryGeometry = await importFreshHook()

    const { result } = renderHook(() => useTerritoryGeometry())

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].id).toBe('ukraine')
    expect(result.current.error).toBe(false)
  })

  it('een tweede hook-instantie hergebruikt de module-scope cache zonder opnieuw te fetchen', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(featureCollection),
    })
    vi.stubGlobal('fetch', fetchMock)
    const useTerritoryGeometry = await importFreshHook()

    const first = renderHook(() => useTerritoryGeometry())
    await waitFor(() => expect(first.result.current.loading).toBe(false))

    const second = renderHook(() => useTerritoryGeometry())

    expect(second.result.current.loading).toBe(false)
    expect(second.result.current.data).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('zet error op true als het ophalen mislukt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve(undefined) }),
    )
    const useTerritoryGeometry = await importFreshHook()

    const { result } = renderHook(() => useTerritoryGeometry())

    await waitFor(() => expect(result.current.error).toBe(true))

    expect(result.current.data).toBeNull()
  })
})
