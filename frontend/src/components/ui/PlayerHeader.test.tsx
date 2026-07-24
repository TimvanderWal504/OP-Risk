import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlayerHeader } from './PlayerHeader'

describe('PlayerHeader', () => {
  it('toont naam, status, timer en de standaard actieknoppen', () => {
    render(
      <PlayerHeader
        name="Tomas"
        colorName="Blauw"
        colorHex="#215C9C"
        status="Jouw beurt · Aanvallen"
        timer="2:41"
      />,
    )

    expect(screen.getByText('Tomas')).toBeInTheDocument()
    expect(screen.getByText('Jouw beurt · Aanvallen')).toBeInTheDocument()
    expect(screen.getByText('2:41')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mijn kaarten' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mijn missie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spelinfo' })).toBeInTheDocument()
  })

  it('roept onSettings aan bij de tandwiel-knop', async () => {
    const onSettings = vi.fn()
    render(
      <PlayerHeader
        name="Tomas"
        colorName="Blauw"
        colorHex="#215C9C"
        status="Jouw beurt"
        timer="2:41"
        onSettings={onSettings}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Instellingen' }))
    expect(onSettings).toHaveBeenCalledTimes(1)
  })
})
