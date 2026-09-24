import { describe, expect, it } from 'vitest'
import { scaleCssPx, sliderToMultiplier } from './tvDisplay'

describe('scaleCssPx', () => {
  it('vermenigvuldigt elke px-lengte en laat de rest van de waarde staan', () => {
    expect(scaleCssPx('inset 1px -1px 0 rgba(0,0,0,.25), 0 8px 20px -6px rgba(0,0,0,.45)', 2)).toBe(
      'inset 2px -2px 0 rgba(0,0,0,.25), 0 16px 40px -12px rgba(0,0,0,.45)',
    )
    expect(scaleCssPx('perspective(400px) rotateX(5deg)', 0.5)).toBe('perspective(200px) rotateX(5deg)')
  })

  it('geeft bij factor 1 exact dezelfde waarde terug', () => {
    const value = '0 8px 20px -6px rgba(0,0,0,.45)'
    expect(scaleCssPx(value, 1)).toBe(value)
  })
})

describe('sliderToMultiplier', () => {
  it.each([
    [0, 0.25],
    [25, 0.625],
    [50, 1],
    [55, 1.1],
    [75, 1.5],
    [100, 2],
  ])('sliderpositie %i geeft factor %d', (value, expected) => {
    expect(sliderToMultiplier(value)).toBeCloseTo(expected, 10)
  })
})
