import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AutoPassScreen } from './AutoPassScreen'

describe('AutoPassScreen', () => {
  it('legt uit wat er gebeurt en verbindt opnieuw met "Ik ben terug"', async () => {
    const onReturn = vi.fn().mockResolvedValue(undefined)
    render(<AutoPassScreen onReturn={onReturn} />)

    expect(screen.getByRole('heading', { name: 'Je staat op auto-pass' })).toBeInTheDocument()
    expect(screen.getByText(/De server speelt je beurten/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ik ben terug' }))

    expect(onReturn).toHaveBeenCalledTimes(1)
  })

  it('zet de knop uit zolang de herverbinding loopt', async () => {
    let finish!: () => void
    const onReturn = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    render(<AutoPassScreen onReturn={onReturn} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ik ben terug' }))
    expect(screen.getByRole('button', { name: 'Ik ben terug' })).toBeDisabled()

    finish()
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Ik ben terug' })).toBeEnabled())
  })
})
