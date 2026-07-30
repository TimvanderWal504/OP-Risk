import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatHeaderCard } from './StatHeaderCard'

describe('StatHeaderCard', () => {
  it('toont kicker, titel en teller', () => {
    render(<StatHeaderCard kicker="Claimen" title="Claim gebieden" statValue={6} statLabel="Vrij" paddingY={11} />)

    expect(screen.getByText('Claimen')).toBeInTheDocument()
    expect(screen.getByText('Claim gebieden')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('Vrij')).toBeInTheDocument()
  })
})
