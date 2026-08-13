import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatHeaderCard } from './StatHeaderCard'

describe('StatHeaderCard', () => {
  it('toont titel en teller', () => {
    render(<StatHeaderCard title="Claim gebieden" statValue={6} statLabel="Vrij" paddingY={11} />)

    expect(screen.getByText('Claim gebieden')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('Vrij')).toBeInTheDocument()
  })

  it('houdt de teller in de titelkleur, ongeacht de accentkleur', () => {
    render(<StatHeaderCard title="Verdeel je legers" statValue={28} statLabel="te verdelen" paddingY={12} accentColor="pitch" />)

    expect(screen.getByText('28')).toHaveClass('text-fg')
  })

  it('toont de hint binnen dezelfde kaart wanneer die is meegegeven', () => {
    render(
      <StatHeaderCard
        title="Plaats je legers"
        statValue={18}
        statLabel="te plaatsen"
        paddingY={12}
        hint="Tik + om 1 leger te zetten."
      />,
    )

    expect(screen.getByText('Tik + om 1 leger te zetten.')).toBeInTheDocument()
  })
})
