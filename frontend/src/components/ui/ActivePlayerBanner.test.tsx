import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivePlayerBanner } from './ActivePlayerBanner'

const color = { id: 'blue', name: 'Blauw', hex: '#2980b9', onHex: '#fff', symbol: 'square' }

describe('ActivePlayerBanner', () => {
  it('toont naam en subtitle', () => {
    render(<ActivePlayerBanner turnOfLabel="Nu aan zet" playerName="Bob" color={color} subtitle="Claim" />)

    expect(screen.getByText(/Nu aan zet: Bob/)).toBeInTheDocument()
    expect(screen.getByText('Claim')).toBeInTheDocument()
  })

  it('toont de teller alleen als stat is meegegeven', () => {
    const { rerender } = render(
      <ActivePlayerBanner turnOfLabel="Nu aan zet" playerName="Bob" color={color} subtitle="Claim" />,
    )
    expect(screen.queryByText('Vrij')).not.toBeInTheDocument()

    rerender(
      <ActivePlayerBanner
        turnOfLabel="Nu aan zet"
        playerName="Bob"
        color={color}
        subtitle="Claim"
        stat={{ value: 12, label: 'Vrij' }}
      />,
    )
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Vrij')).toBeInTheDocument()
  })
})
