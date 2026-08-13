import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InstructionKicker } from './InstructionKicker'

describe('InstructionKicker', () => {
  it('rendert de meegegeven tekst op een glas-surface', () => {
    render(<InstructionKicker>Claim gebied</InstructionKicker>)
    const kicker = screen.getByText('Claim gebied')
    expect(kicker).toHaveAttribute('data-glass-filter', 'on')
  })
})
