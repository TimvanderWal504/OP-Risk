import { describe, expect, it } from 'vitest'
import { DESIGN_UNIT_PX, designToMap } from './boardScale'
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from './projection'
import { boardViewBox } from '../design-reference/shared/design-tokens'

describe('designToMap', () => {
  it('laat de hoogte van de design-viewBox samenvallen met die van de kaart-viewBox', () => {
    expect(designToMap(boardViewBox.h)).toBeCloseTo(MAP_HEIGHT_PX, 5)
  })

  it('gebruikt de hoogte als bindende as, zoals `slice` in de export doet', () => {
    expect(DESIGN_UNIT_PX).toBeCloseTo(2132 / 790, 5)

    // De breedte bindt niet: de achtergrond is in de export 4096 × (790/2132) = 1517,75
    // design-eenheden breed en dus bréder dan de 1500-eenheden-box, waardoor `slice` er links
    // en rechts 8,87 eenheid van wegknipt. Omgekeerd dekken 1500 design-eenheden daarom mínder
    // dan de volle viewBox-breedte, en is het gat precies die weggeknipte rand.
    expect(designToMap(boardViewBox.w)).toBeLessThan(MAP_WIDTH_PX)
    expect(MAP_WIDTH_PX - designToMap(boardViewBox.w)).toBeCloseTo(2 * designToMap(8.874), 1)
  })

  it('schaalt lineair vanaf nul', () => {
    expect(designToMap(0)).toBe(0)
    expect(designToMap(40)).toBeCloseTo(2 * designToMap(20), 5)
  })
})
