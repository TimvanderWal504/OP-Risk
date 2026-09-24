import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlayerEliminatedScreen } from './PlayerEliminatedScreen'

const red = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#ffffff', symbol: 'circle' }

describe('PlayerEliminatedScreen', () => {
  it('toont de uitgeschakeld-melding zonder eigen acties', () => {
    render(<PlayerEliminatedScreen myColor={red} />)

    expect(screen.getByText('Je bent uitgeschakeld')).toBeInTheDocument()
    // Spelinfo en (voor de host) TV-weergave lopen via de header erboven, niet via dit scherm.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
