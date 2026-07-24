import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './Switch'

describe('Switch', () => {
  it('roept onToggle aan bij klik en spiegelt aria-pressed', async () => {
    const onToggle = vi.fn()
    render(<Switch on={false} onToggle={onToggle} label="Rollen" />)

    const button = screen.getByRole('button', { name: 'Rollen' })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(button)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('klikt niet wanneer disabled', async () => {
    const onToggle = vi.fn()
    render(<Switch on onToggle={onToggle} disabled label="Rollen" />)

    await userEvent.click(screen.getByRole('button', { name: 'Rollen' }))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
