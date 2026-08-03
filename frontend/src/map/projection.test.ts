import { describe, expect, it } from 'vitest'
import {
  LAT_MAX,
  LAT_MIN,
  LON_MAX,
  LON_MIN,
  MAP_HEIGHT_PX,
  MAP_WIDTH_PX,
  project,
  ringToPath,
  shiftRingForKamchatka,
} from './projection'
import type { LonLat } from './projection'

describe('project', () => {
  it('projecteert de westrand van het venster op x=0', () => {
    expect(project(LON_MIN, 0).x).toBeCloseTo(0, 5)
  })

  it('projecteert de oostrand van het venster op x=MAP_WIDTH_PX', () => {
    expect(project(LON_MAX, 0).x).toBeCloseTo(MAP_WIDTH_PX, 5)
  })

  it('projecteert de noordrand van het venster op y=0 en de zuidrand op y=MAP_HEIGHT_PX', () => {
    expect(project(0, LAT_MAX).y).toBeCloseTo(0, 5)
    expect(project(0, LAT_MIN).y).toBeCloseTo(MAP_HEIGHT_PX, 5)
  })
})

describe('shiftRingForKamchatka', () => {
  it('vouwt een ring die zowel <-150° als >150° bevat naar één aaneengesloten oostkant', () => {
    // Vorm van de daadwerkelijke kamchatka-feature: kruist de datumgrens.
    const ring: LonLat[] = [
      [178, 51],
      [-178, 52],
      [-179, 60],
      [179, 61],
    ]

    const shifted = shiftRingForKamchatka(ring)

    // Alle punten liggen nu aaneengesloten rond 180-182°, niet uiteen bij -179/-178 en 178/179.
    for (const [lon] of shifted) {
      expect(lon).toBeGreaterThan(170)
      expect(lon).toBeLessThan(190)
    }
  })

  it('vouwt een volledig omgeklapte ring (alle lengtegraden negatief) naar +360°', () => {
    const ring: LonLat[] = [
      [-179, 60],
      [-178, 61],
    ]

    const shifted = shiftRingForKamchatka(ring)

    expect(shifted).toEqual([
      [181, 60],
      [182, 61],
    ])
  })

  it('laat een ring die het patroon niet vertoont ongewijzigd', () => {
    const ring: LonLat[] = [
      [10, 50],
      [11, 51],
    ]

    expect(shiftRingForKamchatka(ring)).toEqual(ring)
  })
})

describe('ringToPath', () => {
  it('bouwt een gesloten SVG-subpath met M/L/Z', () => {
    const ring: LonLat[] = [
      [LON_MIN, LAT_MAX],
      [LON_MAX, LAT_MAX],
    ]

    expect(ringToPath(ring)).toBe(`M 0.0,0.0 L ${MAP_WIDTH_PX.toFixed(1)},0.0 Z`)
  })
})
