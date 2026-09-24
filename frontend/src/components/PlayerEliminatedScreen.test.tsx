import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlayerEliminatedScreen } from './PlayerEliminatedScreen'

const red = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#ffffff', symbol: 'circle' }

describe('PlayerEliminatedScreen', () => {
  it('toont zonder host-acties alleen de uitgeschakeld-melding', () => {
    render(<PlayerEliminatedScreen myColor={red} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('toont de host-acties onder de melding (plan-testronde-tv punt 2)', () => {
    render(<PlayerEliminatedScreen myColor={red} hostActions={<button type="button">TV-weergave</button>} />)

    expect(screen.getByRole('button', { name: 'TV-weergave' })).toBeInTheDocument()
  })
})
