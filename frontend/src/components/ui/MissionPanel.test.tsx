import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MissionPanel } from './MissionPanel'

describe('MissionPanel', () => {
  it('toont de naam en omschrijving van de opgegeven missie', () => {
    render(<MissionPanel missionId="territory-24" onClose={vi.fn()} />)

    expect(screen.getByText('Bezit 24 gebieden')).toBeInTheDocument()
    expect(screen.getByText('Bezit op enig moment 24 gebieden, ongeacht welke.')).toBeInTheDocument()
  })

  it('toont het geheime-missie-label en de hangslot-regel', () => {
    render(<MissionPanel missionId="territory-24" onClose={vi.fn()} />)

    expect(screen.getByText('Geheime missie')).toBeInTheDocument()
    expect(screen.getByText('Alleen zichtbaar voor jou.')).toBeInTheDocument()
  })

  it('roept onClose aan bij de sluitknop', async () => {
    const onClose = vi.fn()
    render(<MissionPanel missionId="territory-24" onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
