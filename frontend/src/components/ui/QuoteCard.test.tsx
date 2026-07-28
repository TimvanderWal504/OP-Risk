import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuoteCard } from './QuoteCard'

describe('QuoteCard', () => {
  it('toont de kicker, quote en auteur correct', () => {
    render(
      <QuoteCard
        quoteKicker="Citaat van de dag"
        quoteText="Kennis is macht."
        quoteAuthor="Francis Bacon"
      />
    )

    expect(screen.getByText('Citaat van de dag')).toBeInTheDocument()
    expect(screen.getByText('Kennis is macht.')).toBeInTheDocument()
    expect(screen.getByText('— Francis Bacon')).toBeInTheDocument()
  })
})