import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvWaitingLayout } from './TvWaitingLayout'

describe('TvWaitingLayout', () => {
  it('zet de titelkolom naast de rail', () => {
    render(
      <TvWaitingLayout badge="Wachtkamer" status="Wachten…">
        <div>rail-inhoud</div>
      </TvWaitingLayout>,
    )

    expect(screen.getByText('Wachtkamer')).toBeInTheDocument()
    expect(screen.getByText('Wachten…')).toBeInTheDocument()
    expect(screen.getByText('rail-inhoud')).toBeInTheDocument()
  })
})
