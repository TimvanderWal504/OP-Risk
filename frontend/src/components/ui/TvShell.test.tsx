import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvShell } from './TvShell'

describe('TvShell', () => {
  it('rendert children binnen de shell-wrapper', () => {
    render(
      <TvShell>
        <p>Inhoud</p>
      </TvShell>,
    )

    expect(screen.getByText('Inhoud').parentElement).toHaveClass('relative')
  })
})
