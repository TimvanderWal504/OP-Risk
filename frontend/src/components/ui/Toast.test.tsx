import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Toast } from './Toast'

describe('Toast', () => {
  it('toont de melding', () => {
    render(<Toast message="Het is niet jouw beurt." device="phone" onDismiss={vi.fn()} />)

    expect(screen.getByText('Het is niet jouw beurt.')).toBeInTheDocument()
  })

  it('roept op de telefoon onDismiss aan via het kruisje', async () => {
    const onDismiss = vi.fn()
    render(<Toast message="Het is niet jouw beurt." device="phone" onDismiss={onDismiss} />)

    await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('heeft op de TV geen kruisje — daar is geen bediening', () => {
    render(<Toast message="Verbinding mislukt." device="tv" onDismiss={vi.fn()} />)

    expect(screen.getByText('Verbinding mislukt.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
