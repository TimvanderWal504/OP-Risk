import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModalShell } from './ModalShell'

describe('ModalShell', () => {
  it('rendert children op een glas-overlay-surface', () => {
    render(<ModalShell context="tv">Overlay-inhoud</ModalShell>)
    const shell = screen.getByText('Overlay-inhoud')
    expect(shell).toHaveAttribute('data-glass-filter', 'on')
  })

  it('geeft className/style door voor positionering', () => {
    render(
      <ModalShell context="phone" className="absolute inset-0 z-[60]">
        Telefoon-overlay
      </ModalShell>,
    )
    expect(screen.getByText('Telefoon-overlay')).toHaveClass('absolute', 'inset-0', 'z-[60]')
  })
})
