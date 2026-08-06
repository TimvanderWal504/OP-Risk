import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NotYourTurnStep } from './NotYourTurnStep'

const activeColor = { id: 'blue', name: 'Blauw', hex: '#2980b9', onHex: '#fff', symbol: 'square' }

describe('NotYourTurnStep', () => {
  it('toont wie er aan de beurt is met de meegegeven subtitle', () => {
    render(<NotYourTurnStep activePlayerName="Bob" activeColor={activeColor} subtitle="Claim" />)

    expect(screen.getByText(/Aan de beurt Bob/)).toBeInTheDocument()
    expect(screen.getByText(/· Claim/)).toBeInTheDocument()
  })
})
