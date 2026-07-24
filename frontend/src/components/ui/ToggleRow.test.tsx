import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToggleRow } from './ToggleRow'

describe('ToggleRow', () => {
  it('rendert label + subtekst en schakelt via de Switch', async () => {
    const onToggle = vi.fn()
    render(<ToggleRow label="Rollen" sub="Openbare rol" on={false} onToggle={onToggle} />)

    expect(screen.getByText('Openbare rol')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Rollen' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('toont de binnenkort-badge en blokkeert schakelen wanneer disabled', async () => {
    const onToggle = vi.fn()
    render(<ToggleRow label="Teamspel" sub="Bondgenoten" on={false} disabled soon onToggle={onToggle} />)

    expect(screen.getByText('binnenkort')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Teamspel' }))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
