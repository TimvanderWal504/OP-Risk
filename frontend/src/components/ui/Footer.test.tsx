import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Footer } from './Footer'
import { Button } from './Button'

describe('Footer', () => {
  it('rendert de children, de foutmelding en de hint', () => {
    render(
      <Footer error="Er ging iets mis" hint="Wachten op spelers">
        <Button>Spel starten</Button>
      </Footer>,
    )

    expect(screen.getByRole('button', { name: 'Spel starten' })).toBeInTheDocument()
    expect(screen.getByText('Er ging iets mis')).toBeInTheDocument()
    expect(screen.getByText('Wachten op spelers')).toBeInTheDocument()
  })

  it('laat de foutregel weg zonder error', () => {
    render(
      <Footer>
        <Button>Volgende</Button>
      </Footer>,
    )

    expect(screen.queryByText('Er ging iets mis')).not.toBeInTheDocument()
  })
})
