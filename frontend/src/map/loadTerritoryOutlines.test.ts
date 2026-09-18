import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadTerritoryOutlines } from './loadTerritoryOutlines'
import { LAT_MAX, LAT_MIN, LON_MAX, LON_MIN, MAP_HEIGHT_PX, MAP_WIDTH_PX } from './projection'

function mockFetchOnce(body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Lon/lat die via `project()` exact op pixel (x, y) uitkomt — omgekeerde van `projection.ts`. */
function lonLatForPixel(x: number, y: number): [number, number] {
  const lon = LON_MIN + (x / MAP_WIDTH_PX) * (LON_MAX - LON_MIN)
  const lat = LAT_MAX - (y / MAP_HEIGHT_PX) * (LAT_MAX - LAT_MIN)

  return [lon, lat]
}

describe('loadTerritoryOutlines', () => {
  it('normaliseert een niet-vierkante bounding box naar een vaste 64x64-viewBox met behouden aspect ratio', async () => {
    // Rechthoek 100x50 "geo-pixels" (via project() teruggerekend) — breder dan hoog, dus de
    // schaal wordt bepaald door de breedte (max(width,height)), niet de hoogte.
    mockFetchOnce({
      type: 'FeatureCollection',
      features: [
        {
          properties: { id: 'ukraine', continent: 'europe', centroid: [0, 0] },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [lonLatForPixel(0, 0), lonLatForPixel(100, 0), lonLatForPixel(100, 50), lonLatForPixel(0, 50)],
            ],
          },
        },
      ],
    })

    const outlines = await loadTerritoryOutlines()

    // drawableSize = 64 - 2*4 = 56; scale = 56/100 = 0.56; offsetX = (64-56)/2 = 4;
    // offsetY = (64-28)/2 = 18 (scaledHeight = 50*0.56 = 28).
    expect(outlines.ukraine.viewBox).toBe('0 0 64 64')
    expect(outlines.ukraine.pathD).toBe('M 4.0,18.0 L 60.0,18.0 L 60.0,46.0 L 4.0,46.0 Z')
  })

  it('geeft altijd dezelfde vaste viewBox, ongeacht de brongrootte van het gebied (IJsland vs. Rusland)', async () => {
    mockFetchOnce({
      type: 'FeatureCollection',
      features: [
        {
          properties: { id: 'iceland', continent: 'europe', centroid: [0, 0] },
          geometry: { type: 'Polygon', coordinates: [[lonLatForPixel(0, 0), lonLatForPixel(5, 5)]] },
        },
        {
          properties: { id: 'russia', continent: 'asia', centroid: [0, 0] },
          geometry: { type: 'Polygon', coordinates: [[lonLatForPixel(0, 0), lonLatForPixel(3000, 1500)]] },
        },
      ],
    })

    const outlines = await loadTerritoryOutlines()

    expect(outlines.iceland.viewBox).toBe('0 0 64 64')
    expect(outlines.russia.viewBox).toBe('0 0 64 64')
  })

  it('normaliseert een MultiPolygon op één gedeelde bounding box, niet per ring apart', async () => {
    // Twee ringen ("eilanden") binnen dezelfde combined bbox (0..100, 0..50) als de eerste
    // test — zelfde scale/offset moet dus voor beide ringen gelden, hun relatieve positie
    // t.o.v. elkaar blijft daardoor kloppen.
    mockFetchOnce({
      type: 'FeatureCollection',
      features: [
        {
          properties: { id: 'indonesia', continent: 'australia', centroid: [0, 0] },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [[lonLatForPixel(0, 0), lonLatForPixel(10, 10)]],
              [[lonLatForPixel(90, 40), lonLatForPixel(100, 50)]],
            ],
          },
        },
      ],
    })

    const outlines = await loadTerritoryOutlines()

    expect(outlines.indonesia.pathD).toBe('M 4.0,18.0 L 9.6,23.6 Z M 54.4,40.4 L 60.0,46.0 Z')
  })

  it('vouwt kamchatka-ringen naar een aaneengesloten oostkant vóór normalisatie, net als loadTerritoryGeometry', async () => {
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

    const outlines = await loadTerritoryOutlines()

    // Zonder de vouw zou -178/-179 een veel bredere (onjuiste) bounding box opleveren die de
    // ring uit elkaar trekt i.p.v. een aaneengesloten oostrand; met de vouw blijft de breedte
    // klein (178..182), dus de resulterende path bevat geen extreme sprong tussen punten.
    const xs = outlines.kamchatka.pathD.match(/[\d.]+(?=,)/g)!.map(Number)
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(56)
  })

  it('gebruikt standaard-43 als er geen mapId wordt meegegeven', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await loadTerritoryOutlines()

    expect(fetchMock).toHaveBeenCalledWith('/maps/standaard-43/territories.geo.json')
  })
})
