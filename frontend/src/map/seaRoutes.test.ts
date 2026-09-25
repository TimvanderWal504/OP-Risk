import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadTerritoryGeometry, type TerritoryGeometry } from './loadTerritoryGeometry'
import { LON_MAX, LON_MIN, MAP_WIDTH_PX, project } from './projection'
import { loadSeaRoutes, toSeaRouteSegments, trimSeaRouteSegment, type SeaRouteSegment } from './seaRoutes'

function territory(id: string, lon: number, lat: number): TerritoryGeometry {
  return { id, continent: 'test', centroidPx: project(lon, lat), pathD: '' }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadSeaRoutes', () => {
  it('levert alleen de zeeverbindingen uit de grenzendata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            borders: [
              { from: 'afghanistan', to: 'india', type: 'land' },
              { from: 'iceland', to: 'greenland', type: 'sea' },
            ],
          }),
      }),
    )

    await expect(loadSeaRoutes()).resolves.toEqual([{ from: 'iceland', to: 'greenland' }])
  })

  it('faalt expliciet bij een niet-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

    await expect(loadSeaRoutes()).rejects.toThrow('404')
  })
})

describe('toSeaRouteSegments', () => {
  it('trekt een gewone zeeroute als één lijnstuk tussen de twee centroïden', () => {
    const geometry = [territory('iceland', -18, 65), territory('greenland', -40, 72)]

    const segments = toSeaRouteSegments([{ from: 'iceland', to: 'greenland' }], geometry)

    expect(segments).toEqual([
      { key: 'iceland--greenland', from: geometry[0].centroidPx, to: geometry[1].centroidPx, toIsEdge: false },
    ])
  })

  it('splitst een route over de datumgrens in twee stompjes naar de kaartranden', () => {
    const geometry = [territory('kamchatka', 164.55, 63.16), territory('alaska', -150, 64)]

    const [fromKamchatka, fromAlaska] = toSeaRouteSegments([{ from: 'kamchatka', to: 'alaska' }], geometry)

    expect(fromKamchatka.from).toEqual(geometry[0].centroidPx)
    expect(fromKamchatka.to.x).toBe(MAP_WIDTH_PX)
    expect(fromKamchatka.toIsEdge).toBe(true)
    expect(fromAlaska.from).toEqual(geometry[1].centroidPx)
    expect(fromAlaska.to.x).toBe(0)
    expect(fromAlaska.toIsEdge).toBe(true)
  })

  it('laat het stompje richting de rand van hoogte verlopen naar de partner', () => {
    const geometry = [territory('new-zealand', 172, -41), territory('argentina', -65, -38)]

    const [fromNewZealand, fromArgentina] = toSeaRouteSegments([{ from: 'new-zealand', to: 'argentina' }], geometry)

    const nz = geometry[0].centroidPx
    const ar = geometry[1].centroidPx
    expect(fromNewZealand.to.y).toBeGreaterThan(ar.y)
    expect(fromNewZealand.to.y).toBeLessThan(nz.y)
    expect(fromArgentina.to.y).toBeGreaterThan(ar.y)
    expect(fromArgentina.to.y).toBeLessThan(nz.y)
  })

  it('trekt één lijn als de verschoven partner in het overlapgebied óp de kaart valt', () => {
    // Het venster beslaat meer dan 360°: 185° en -170° zijn 355° uit elkaar (dus "over de
    // datumgrens"), maar -170° + 360° = 190° ligt nog binnen LON_MAX — er is geen rand om naar
    // te wijzen, dus geen stompjes (en geen deling door nul in de randclip).
    expect(LON_MAX).toBeGreaterThan(190)
    expect(LON_MIN).toBeLessThan(-175)
    const geometry = [territory('far-east', 185, 65), territory('far-west', -170, 65)]

    const segments = toSeaRouteSegments([{ from: 'far-east', to: 'far-west' }], geometry)

    expect(segments).toEqual([
      { key: 'far-east--far-west', from: geometry[0].centroidPx, to: geometry[1].centroidPx, toIsEdge: false },
    ])
  })

  it('slaat een route met een onbekend gebied over', () => {
    const segments = toSeaRouteSegments([{ from: 'iceland', to: 'atlantis' }], [territory('iceland', -18, 65)])

    expect(segments).toEqual([])
  })
})

describe('trimSeaRouteSegment', () => {
  const segment = (toIsEdge: boolean): SeaRouteSegment => ({
    key: 'a--b',
    from: { x: 0, y: 0 },
    to: { x: 30, y: 40 },
    toIsEdge,
  })

  it('kort beide centroïde-uiteinden in langs de lijn', () => {
    const trimmed = trimSeaRouteSegment(segment(false), 5)

    expect(trimmed?.from.x).toBeCloseTo(3)
    expect(trimmed?.from.y).toBeCloseTo(4)
    expect(trimmed?.to.x).toBeCloseTo(27)
    expect(trimmed?.to.y).toBeCloseTo(36)
  })

  it('laat een kaartrand-uiteinde staan', () => {
    const trimmed = trimSeaRouteSegment(segment(true), 5)

    expect(trimmed?.from.x).toBeCloseTo(3)
    expect(trimmed?.to).toEqual({ x: 30, y: 40 })
  })

  it('laat een lijn wegvallen die volledig onder de schijven verdwijnt', () => {
    expect(trimSeaRouteSegment(segment(false), 25)).toBeNull()
  })
})

describe('zeeroutes op de echte kaartdata (standaard-43)', () => {
  function readMapFile(fileName: string): unknown {
    const mapDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../data/maps/standaard-43')
    return JSON.parse(readFileSync(resolve(mapDir, fileName), 'utf-8'))
  }

  function stubFetchWith(body: unknown): void {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) }))
  }

  it('levert 26 lijnstukken (22 routes + 2×2 stompjes), allemaal eindig en binnen de kaart', async () => {
    stubFetchWith(readMapFile('territories.geo.json'))
    const geometry = await loadTerritoryGeometry()
    stubFetchWith(readMapFile('adjacency_validated.json'))
    const routes = await loadSeaRoutes()

    const segments = toSeaRouteSegments(routes, geometry)

    expect(routes).toHaveLength(24)
    expect(segments).toHaveLength(26)
    expect(segments.filter((segment) => segment.toIsEdge)).toHaveLength(4)
    for (const { from, to } of segments) {
      for (const { x, y } of [from, to]) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(MAP_WIDTH_PX)
      }
    }
  })
})
