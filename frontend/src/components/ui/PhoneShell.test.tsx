import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PhoneShell } from './PhoneShell'

describe('PhoneShell', () => {
  it('rendert de kinderen', () => {
    render(
      <PhoneShell>
        <span>Inhoud</span>
      </PhoneShell>,
    )
    expect(screen.getByText('Inhoud')).toBeInTheDocument()
  })
})
