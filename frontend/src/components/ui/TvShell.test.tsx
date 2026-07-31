import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvShell } from './TvShell'

describe('TvShell', () => {
  it('draait altijd in het donkere thema, ongeacht OS-voorkeur (Host-scherm.dc.html L34)', () => {
    render(
      <TvShell>
        <p>Inhoud</p>
      </TvShell>,
    )

    expect(screen.getByText('Inhoud').parentElement).toHaveClass('dark')
  })
})
