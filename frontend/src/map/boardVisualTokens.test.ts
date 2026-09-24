import { describe, expect, it } from 'vitest'
import { claimMarker, marker, scaledClaimMarker, scaledMarker } from './boardVisualTokens'

describe('scaledMarker', () => {
  it('geeft bij factor 1 exact de design-markers terug', () => {
    expect(scaledMarker(1)).toBe(marker)
  })

  it('schaalt alle lengtes van de marker als geheel, maar niet de contour-opacity', () => {
    const scaled = scaledMarker(2)

    expect(scaled.discR).toBe(marker.discR * 2)
    expect(scaled.armyFontSize).toBe(marker.armyFontSize * 2)
    expect(scaled.nameFontSize).toBe(marker.nameFontSize * 2)
    expect(scaled.nameOffsetY).toBe(marker.nameOffsetY * 2)
    expect(scaled.nameStrokeWidth).toBe(marker.nameStrokeWidth * 2)
    expect(scaled.ringSwOwn).toBe(marker.ringSwOwn * 2)
    expect(scaled.nameStrokeOpacity).toBe(marker.nameStrokeOpacity)
  })
})

describe('scaledClaimMarker', () => {
  it('schaalt schijf, symbool en flare, maar niet de randen van de gebiedspolygonen', () => {
    const scaled = scaledClaimMarker(0.5)

    expect(scaled.discR).toBe(claimMarker.discR * 0.5)
    expect(scaled.symFontSize).toBe(claimMarker.symFontSize * 0.5)
    expect(scaled.flareR).toBe(claimMarker.flareR * 0.5)
    expect(scaled.territorySwClaimed).toBe(claimMarker.territorySwClaimed)
    expect(scaled.territorySwFlare).toBe(claimMarker.territorySwFlare)
  })
})
