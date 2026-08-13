import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { atlasRoughTok } from '../../styles/design-tokens'
import { DESIGN_UNIT_PX, designToMap } from '../../map/boardScale'
import type { TerritoryGeometry } from '../../map/loadTerritoryGeometry'
import { TvBoardMap } from './TvBoardMap'

const geometry: TerritoryGeometry[] = [
  { id: 'alaska', continent: 'north-america', centroidPx: { x: 10, y: 20 }, pathD: 'M0 0 L1 1 Z' },
  { id: 'ukraine', continent: 'europe', centroidPx: { x: 30, y: 40 }, pathD: 'M2 2 L3 3 Z' },
]

describe('TvBoardMap', () => {
  it('rendert een pad per gebied, gestyled via getTerritoryVisual, in de opgegeven filter', () => {
    const { container } = render(
      <TvBoardMap
        geometry={geometry}
        filterId="atlasRoughTest"
        getTerritoryVisual={() => ({
          fillHex: '#123456',
          fillOpacity: 0.25,
          strokeHex: '#123456',
          strokeOpacity: 1,
          strokeWidth: 2,
        })}
        renderMarker={() => null}
      />,
    )

    const filter = container.querySelector('filter#atlasRoughTest')
    expect(filter).not.toBeNull()

    const turbulence = filter?.querySelector('feTurbulence')
    expect(turbulence?.getAttribute('baseFrequency')).toBe(String(atlasRoughTok.baseFrequency / DESIGN_UNIT_PX))
    expect(turbulence?.getAttribute('numOctaves')).toBe(String(atlasRoughTok.numOctaves))
    expect(turbulence?.getAttribute('seed')).toBe(String(atlasRoughTok.seed))

    const displacement = filter?.querySelector('feDisplacementMap')
    expect(displacement?.getAttribute('scale')).toBe(String(designToMap(atlasRoughTok.scale)))

    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(2)
    expect(paths[0].getAttribute('fill')).toBe('#123456')
    expect(paths[0].closest('g')?.getAttribute('filter')).toBe('url(#atlasRoughTest)')
  })

  it('roept renderMarker per gebied aan en rendert extraOverlay erna', () => {
    const { container, getByText } = render(
      <TvBoardMap
        geometry={geometry}
        filterId="atlasRoughTest2"
        getTerritoryVisual={() => ({ fillHex: '#000', fillOpacity: 0, strokeHex: '#000', strokeOpacity: 0, strokeWidth: 0 })}
        renderMarker={(territory) => <text key={territory.id}>{territory.id}</text>}
        extraOverlay={<circle data-testid="flare" r={1} />}
      />,
    )

    const svg = container.querySelector('svg')! as unknown as HTMLElement
    expect(within(svg).getByText('alaska')).toBeInTheDocument()
    expect(within(svg).getByText('ukraine')).toBeInTheDocument()
    expect(getByText('alaska')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="flare"]')).not.toBeNull()
  })

  it('past glowColor toe op de drop-shadow als die is opgegeven, anders fillHex', () => {
    const { container } = render(
      <TvBoardMap
        geometry={[geometry[0]]}
        filterId="atlasRoughTest3"
        getTerritoryVisual={() => ({
          fillHex: '#111111',
          fillOpacity: 1,
          strokeHex: '#ffffff',
          strokeOpacity: 1,
          strokeWidth: 1,
          glowPx: 3,
          glowColor: '#abcdef',
        })}
        renderMarker={() => null}
      />,
    )

    const path = container.querySelector('path')
    expect(path?.getAttribute('style')).toContain('drop-shadow(0 0 3px #abcdef)')
  })
})
