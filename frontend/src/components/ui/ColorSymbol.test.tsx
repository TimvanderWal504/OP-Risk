import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ColorSymbol } from './ColorSymbol'

describe('ColorSymbol', () => {
  it.each([
    ['circle', '●'],
    ['square', '■'],
    ['triangle', '▲'],
    ['diamond', '◆'],
    ['star', '★'],
    ['hexagon', '⬡'],
    ['cross', '✚'],
  ])('toont het teken voor %s', (symbol, glyph) => {
    render(<ColorSymbol symbol={symbol} />)
    expect(screen.getByText(glyph)).toBeInTheDocument()
  })

  it('toont niets voor een onbekend symbool', () => {
    const { container } = render(<ColorSymbol symbol="onbekend" />)
    expect(container.textContent).toBe('')
  })
})
