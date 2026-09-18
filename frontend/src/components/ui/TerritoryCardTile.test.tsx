import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TerritoryCardTile } from './TerritoryCardTile'
import type { CardThemeId } from '../../config/resolveCardTheme'

let mockTheme: CardThemeId = 'classic'
vi.mock('../../config/resolveCardTheme', () => ({
  resolveCardTheme: () => mockTheme,
}))

afterEach(() => {
  mockTheme = 'classic'
})

const outline = { viewBox: '0 0 64 64', pathD: 'M 0.0,0.0 L 64.0,0.0 Z' }

describe('TerritoryCardTile', () => {
  it('toont het symboollabel en de gebiedsnaam', () => {
    render(<TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned={false} outline={null} />)

    expect(screen.getByText('Infanterie')).toBeInTheDocument()
    expect(screen.getByText('Alaska')).toBeInTheDocument()
  })

  it('geeft de tegel een pitch-700-rand wanneer owned waar is, geen rand daarbuiten', () => {
    const { container: unowned } = render(
      <TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned={false} outline={null} />,
    )
    expect(unowned.firstElementChild?.getAttribute('style')).not.toContain('var(--pitch-700)')

    const { container: owned } = render(
      <TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned outline={null} />,
    )
    expect(owned.firstElementChild?.getAttribute('style')).toContain('var(--pitch-700)')
  })

  it('toont 3 waarde-iconen en het "Joker"-label onderaan, zonder naam/omlijning', () => {
    const { container } = render(
      <TerritoryCardTile card={{ id: 'j1', territoryId: null, symbol: 'joker' }} owned={false} outline={outline} />,
    )

    // Geen gebiedsnaam/omlijning — alleen de 3 waarde-iconen (part 1/2/3 bestaan hier uit iconen)
    // plus hetzelfde soort label als een gewone kaart onder zijn waarde-icoon toont.
    expect(screen.getByText('Joker')).toBeInTheDocument()
    expect(container.querySelector('svg[viewBox="0 0 64 64"]')).not.toBeInTheDocument()
    expect(container.querySelectorAll('svg')).toHaveLength(3)
  })

  it('rendert de aangeleverde omlijning in het tweede deel, geen omlijning-svg zolang outline null is', () => {
    const { container: withOutline } = render(
      <TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned={false} outline={outline} />,
    )
    expect(withOutline.querySelector('svg[viewBox="0 0 64 64"]')).toBeInTheDocument()

    const { container: withoutOutline } = render(
      <TerritoryCardTile card={{ id: 'c2', territoryId: 'alberta', symbol: 'symbol-1' }} owned={false} outline={null} />,
    )
    expect(withoutOutline.querySelector('svg[viewBox="0 0 64 64"]')).not.toBeInTheDocument()
  })

  it('houdt de volgorde naam → omlijning → waarde aan, zonder scheidingslijnen tussen de delen', () => {
    const { container } = render(
      <TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned={false} outline={outline} />,
    )

    const name = screen.getByText('Alaska')
    const outlineSvg = container.querySelector('svg[viewBox="0 0 64 64"]')!
    const valueIcon = container.querySelector('svg:not([viewBox="0 0 64 64"])')!

    // DOCUMENT_POSITION_FOLLOWING (4): het tweede argument komt ná het eerste in de DOM.
    expect(name.compareDocumentPosition(outlineSvg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(outlineSvg.compareDocumentPosition(valueIcon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(container.querySelectorAll('.border-t')).toHaveLength(0)
  })

  it('geeft het omlijning-deel dubbel zoveel ruimte als naam/waarde (flex-[2] i.p.v. flex-1)', () => {
    const { container } = render(
      <TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned={false} outline={outline} />,
    )

    const outlineSvg = container.querySelector('svg[viewBox="0 0 64 64"]')!
    const outlinePart = outlineSvg.parentElement!
    expect(outlinePart.className).toContain('flex-[2]')
    // De svg zelf vult die ruimte volledig, geen max-h-cap meer.
    expect(outlineSvg.getAttribute('class')).toContain('h-full')
    expect(outlineSvg.getAttribute('class')).not.toContain('max-h')
  })

  it('toont een thema-bewust waarde-icoon: symbol-2 verschilt per thema, symbol-1 blijft gelijk', () => {
    const { container: classicSymbol2 } = render(
      <TerritoryCardTile card={{ id: 'c1', territoryId: 'ukraine', symbol: 'symbol-2' }} owned={false} outline={null} />,
    )
    // Cavalerie.svg (classic symbol-2): eigen bron-viewBox 234x305.
    expect(classicSymbol2.querySelectorAll('svg')[0].getAttribute('viewBox')).toBe('0 0 234 305')

    mockTheme = 'modern'
    const { container: modernSymbol2 } = render(
      <TerritoryCardTile card={{ id: 'c1', territoryId: 'ukraine', symbol: 'symbol-2' }} owned={false} outline={null} />,
    )
    // Pantser.svg (modern symbol-2): eigen bron-viewBox 251x151 — niet hetzelfde icoon als classic.
    expect(modernSymbol2.querySelectorAll('svg')[0].getAttribute('viewBox')).toBe('0 0 251 151')

    const { container: modernSymbol1 } = render(
      <TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned={false} outline={null} />,
    )
    // symbol-1 is in beide thema's Infanterie (hergebruikt, geen los tweede icoon).
    expect(modernSymbol1.querySelectorAll('svg')[0].getAttribute('viewBox')).toBe('0 0 166 248')
  })
})
