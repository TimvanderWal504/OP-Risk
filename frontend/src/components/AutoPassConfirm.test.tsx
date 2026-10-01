import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AutoPassConfirm } from './AutoPassConfirm'

describe('AutoPassConfirm', () => {
  it('noemt de speler bij naam, nooit "hij" of "zij"', () => {
    render(<AutoPassConfirm playerName="Bob" onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Bob op auto-pass zetten?' })).toBeInTheDocument()
    expect(screen.getByText('De server speelt de beurten van Bob: versterken aan het front, niet aanvallen.')).toBeInTheDocument()
    expect(screen.getByText('Bob verdedigt automatisch met het maximum.')).toBeInTheDocument()
    expect(screen.getByText('Bob is terug zodra de app weer verbinding maakt.')).toBeInTheDocument()
    expect(screen.queryByText(/\b(hij|zij|zijn)\b/i)).not.toBeInTheDocument()
  })

  it('bevestigt of annuleert', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const onCancel = vi.fn()
    render(<AutoPassConfirm playerName="Bob" onConfirm={onConfirm} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: 'Annuleren' }))
    expect(onCancel).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Op auto-pass zetten' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
