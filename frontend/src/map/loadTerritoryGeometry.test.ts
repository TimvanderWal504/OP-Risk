import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadTerritoryGeometry } from './loadTerritoryGeometry'
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from './projection'

function mockFetchOnce(body: unknown, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadTerritoryGeometry', () => {
  it('zet een Polygon-feature om naar centroidPx en één subpath', async () => {
    mockFetchOnce({
      type: 'FeatureCollection',
      features: [
        {
          properties: { id: 'ukraine', continent: 'europe', centroid: [-180, 90] },
          geometry: { type: 'Polygon', coordinates: [[[-180, 90], [191, 90]]] },
        },
      ],
    })

    const [geometry] = await loadTerritoryGeometry()

    expect(geometry.id).toBe('ukraine')
    expect(geometry.continent).toBe('europe')
    expect(geometry.centroidPx).toEqual({ x: 0, y: 0 })
    expect(geometry.pathD).toBe(`M 0.0,0.0 L ${MAP_WIDTH_PX.toFixed(1)},0.0 Z`)
  })

  it('zet een MultiPolygon-feature om naar meerdere subpaths in één pathD-string', async () => {
    mockFetchOnce({
      type: 'FeatureCollection',
      features: [
        {
          properties: { id: 'indonesia', continent: 'australia', centroid: [0, 0] },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [[[-180, 90], [191, 90]]],
              [[[-180, -90], [191, -90]]],
            ],
          },
        },
      ],
    })

    const [geometry] = await loadTerritoryGeometry()

    expect(geometry.pathD).toBe(
      `M 0.0,0.0 L ${MAP_WIDTH_PX.toFixed(1)},0.0 Z M 0.0,${MAP_HEIGHT_PX.toFixed(1)} L ${MAP_WIDTH_PX.toFixed(1)},${MAP_HEIGHT_PX.toFixed(1)} Z`,
    )
  })

  it('vouwt kamchatka-ringen en -centroid naar een aaneengesloten oostkant vóór projectie', async () => {
    mockFetchOnce({
      type: 'FeatureCollection',
      features: [
        {
          properties: { id: 'kamchatka', continent: 'asia', centroid: [-179, 60] },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[[178, 51], [-178, 52], [-179, 60], [179, 61]]]],
          },
        },
      ],
    })

    const [geometry] = await loadTerritoryGeometry()

    // -179 + 360 = 181° → x = ((181 - -180) / (191 - -180)) * 1920
    const expectedX = ((181 - -180) / (191 - -180)) * MAP_WIDTH_PX
    expect(geometry.centroidPx.x).toBeCloseTo(expectedX, 5)
  })

  it('gooit een fout als de kaartgeometrie niet opgehaald kan worden', async () => {
    mockFetchOnce(undefined, false, 404)

    await expect(loadTerritoryGeometry()).rejects.toThrow(/404/)
  })

  it('gebruikt standaard-43 als er geen mapId wordt meegegeven', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await loadTerritoryGeometry()

    expect(fetchMock).toHaveBeenCalledWith('/maps/standaard-43/territories.geo.json')
  })
})
