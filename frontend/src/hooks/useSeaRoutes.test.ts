import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TerritoryGeometry } from '../map/loadTerritoryGeometry'

const adjacency = {
  borders: [
    { from: 'iceland', to: 'greenland', type: 'sea' },
    { from: 'iceland', to: 'scandinavia', type: 'land' },
  ],
}

const geometry: TerritoryGeometry[] = [
  { id: 'iceland', continent: 'europe', centroidPx: { x: 100, y: 50 }, pathD: '' },
  { id: 'greenland', continent: 'north-america', centroidPx: { x: 80, y: 40 }, pathD: '' },
]

// `useSeaRoutes` cachet in module-scope state — elke test importeert de module daarom vers.
async function importFreshHook() {
  vi.resetModules()
  const module = await import('./useSeaRoutes')
  return module.useSeaRoutes
}

function mockFetch(response: object) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('useSeaRoutes', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('levert de zeeroutes als lijnstukken zodra grenzen en geometrie er zijn', async () => {
    mockFetch({ ok: true, status: 200, json: () => Promise.resolve(adjacency) })
    const useSeaRoutes = await importFreshHook()

    const { result } = renderHook(() => useSeaRoutes(geometry))

    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0]).toEqual({
      key: 'iceland--greenland',
      from: { x: 100, y: 50 },
      to: { x: 80, y: 40 },
      toIsEdge: false,
    })
  })

  it('blijft leeg zolang de geometrie nog niet geladen is, ook als de grenzen er al zijn', async () => {
    const json = vi.fn(() => Promise.resolve(adjacency))
    mockFetch({ ok: true, status: 200, json })
    const useSeaRoutes = await importFreshHook()

    const { result, rerender } = renderHook(({ g }) => useSeaRoutes(g), {
      initialProps: { g: null as TerritoryGeometry[] | null },
    })

    await waitFor(() => expect(json).toHaveBeenCalled())
    await act(async () => {})
    expect(result.current).toEqual([])

    // Bewijs dat de grenzen intussen wél geladen waren: zodra de geometrie er is, direct lijnen.
    rerender({ g: geometry })
    expect(result.current).toHaveLength(1)
  })

  it('fetcht maar één keer per sessie, ook over remounts heen', async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, json: () => Promise.resolve(adjacency) })
    const useSeaRoutes = await importFreshHook()

    const first = renderHook(() => useSeaRoutes(geometry))
    await waitFor(() => expect(first.result.current).toHaveLength(1))
    first.unmount()

    const second = renderHook(() => useSeaRoutes(geometry))
    expect(second.result.current).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('blijft leeg als de grenzen niet geladen kunnen worden', async () => {
    const fetchMock = mockFetch({ ok: false, status: 500 })
    const useSeaRoutes = await importFreshHook()

    const { result } = renderHook(() => useSeaRoutes(geometry))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })
})
