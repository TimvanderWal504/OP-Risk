import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlayerAvatar } from './PlayerAvatar'

describe('PlayerAvatar', () => {
  it('toont het kleursymbool', () => {
    render(<PlayerAvatar colorHex="#215C9C" colorSymbol="square" />)
    expect(screen.getByText('■')).toBeInTheDocument()
  })

  it('past colorOnHex toe als tekstkleur van het symbool', () => {
    render(<PlayerAvatar colorHex="#215C9C" colorOnHex="#FFFFFF" colorSymbol="square" />)
    expect(screen.getByText('■').parentElement).toHaveStyle({ color: '#FFFFFF' })
  })
})
