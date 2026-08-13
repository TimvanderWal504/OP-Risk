import { describe, expect, it } from 'vitest'
import { DESIGN_UNIT_PX, designToMap } from './boardScale'
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from './projection'
import { boardViewBox } from '../styles/design-tokens'

describe('designToMap', () => {
  it('laat de hoogte van de design-viewBox samenvallen met die van de kaart-viewBox', () => {
    expect(designToMap(boardViewBox.h)).toBeCloseTo(MAP_HEIGHT_PX, 5)
  })

  it('gebruikt de hoogte als bindende as, zoals `slice` in de export doet', () => {
    expect(DESIGN_UNIT_PX).toBeCloseTo(1832 / 790, 5)

    // De breedte bindt niet: de achtergrond is in de export 4096 × (790/1832) = 1766,29
    // design-eenheden breed en dus bréder dan de 1500-eenheden-box, waardoor `slice` er links
    // en rechts 133,14 eenheid van wegknipt. Omgekeerd dekken 1500 design-eenheden daarom mínder
    // dan de volle viewBox-breedte, en is het gat precies die weggeknipte rand.
    expect(designToMap(boardViewBox.w)).toBeLessThan(MAP_WIDTH_PX)
    expect(MAP_WIDTH_PX - designToMap(boardViewBox.w)).toBeCloseTo(2 * designToMap(133.1441), 1)
  })

  it('schaalt lineair vanaf nul', () => {
    expect(designToMap(0)).toBe(0)
    expect(designToMap(40)).toBeCloseTo(2 * designToMap(20), 5)
  })
})
