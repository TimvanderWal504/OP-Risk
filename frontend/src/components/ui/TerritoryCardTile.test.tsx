import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TerritoryCardTile } from './TerritoryCardTile'

describe('TerritoryCardTile', () => {
  it('toont het symboollabel en de gebiedsnaam', () => {
    render(<TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned={false} />)

    expect(screen.getByText('Infanterie')).toBeInTheDocument()
    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.queryByText('Gebied in bezit')).not.toBeInTheDocument()
  })

  it('toont "Gebied in bezit" alleen wanneer owned waar is', () => {
    render(<TerritoryCardTile card={{ id: 'c1', territoryId: 'alaska', symbol: 'symbol-1' }} owned />)

    expect(screen.getByText('Gebied in bezit')).toBeInTheDocument()
  })

  it('toont het joker-label i.p.v. een gebiedsnaam voor een joker-kaart', () => {
    render(<TerritoryCardTile card={{ id: 'j1', territoryId: null, symbol: 'joker' }} owned={false} />)

    expect(screen.getAllByText('Joker')).toHaveLength(2)
  })
})
