import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadTerritoryGeometry } from './loadTerritoryGeometry'
import { LAT_MAX, LAT_MIN, LON_MAX, LON_MIN, MAP_HEIGHT_PX, MAP_WIDTH_PX } from './projection'

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
          properties: { id: 'ukraine', continent: 'europe', centroid: [LON_MIN, LAT_MAX] },
          geometry: { type: 'Polygon', coordinates: [[[LON_MIN, LAT_MAX], [LON_MAX, LAT_MAX]]] },
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
              [[[LON_MIN, LAT_MAX], [LON_MAX, LAT_MAX]]],
              [[[LON_MIN, LAT_MIN], [LON_MAX, LAT_MIN]]],
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

  it('vouwt kamchatka-ringen naar een aaneengesloten oostkant vóór projectie', async () => {
    mockFetchOnce({
      type: 'FeatureCollection',
      features: [
        {
          properties: { id: 'kamchatka', continent: 'asia', centroid: [181, 60] },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[[178, 51], [-178, 52], [-179, 60], [179, 61]]]],
          },
        },
      ],
    })

    const [geometry] = await loadTerritoryGeometry()

    // -178 + 360 = 182° en -179 + 360 = 181°: beide overgeklapte punten liggen ná de vouw
    // rechts van 178°, dus de ring loopt door i.p.v. terug te springen naar de westrand.
    const x = (lon: number) => (((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_WIDTH_PX).toFixed(1)
    expect(geometry.pathD).toContain(`L ${x(182)},`)
    expect(geometry.pathD).toContain(`L ${x(181)},`)
    expect(geometry.pathD).not.toContain(`L ${x(-178)},`)
  })

  it('projecteert de centroid uit de brondata ongewijzigd, ook voor kamchatka', async () => {
    mockFetchOnce({
      type: 'FeatureCollection',
      features: [
        {
          properties: { id: 'kamchatka', continent: 'asia', centroid: [164.55, 63.16] },
          geometry: { type: 'Polygon', coordinates: [[[178, 51], [-178, 52], [179, 61]]] },
        },
      ],
    })

    const [geometry] = await loadTerritoryGeometry()

    // Brondata-centroïden zijn al post-vouw (zie loadTerritoryGeometry.ts): geen +360 erbij.
    expect(geometry.centroidPx.x).toBeCloseTo(((164.55 - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_WIDTH_PX, 5)
    expect(geometry.centroidPx.y).toBeCloseTo(((LAT_MAX - 63.16) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT_PX, 5)
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
