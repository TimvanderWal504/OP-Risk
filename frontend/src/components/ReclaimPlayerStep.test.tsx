import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReclaimPlayerStep } from './ReclaimPlayerStep'

describe('ReclaimPlayerStep', () => {
  it('houdt de knop uit zolang er geen naam is ingevuld', async () => {
    render(<ReclaimPlayerStep onSubmit={vi.fn()} onBack={vi.fn()} />)

    const submit = screen.getByRole('button', { name: /verbind opnieuw/i })
    expect(submit).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText(/jouw naam/i), '   ')
    expect(submit).toBeDisabled()
  })

  it('stuurt de naam zonder omringende spaties naar onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ReclaimPlayerStep onSubmit={onSubmit} onBack={vi.fn()} />)

    await userEvent.type(screen.getByPlaceholderText(/jouw naam/i), '  Tomas ')
    await userEvent.click(screen.getByRole('button', { name: /verbind opnieuw/i }))

    expect(onSubmit).toHaveBeenCalledWith('Tomas')
  })

  it('zet de knop uit tijdens het versturen en weer aan daarna', async () => {
    let resolve!: () => void
    const onSubmit = vi.fn(() => new Promise<void>((done) => (resolve = done)))
    render(<ReclaimPlayerStep onSubmit={onSubmit} onBack={vi.fn()} />)

    await userEvent.type(screen.getByPlaceholderText(/jouw naam/i), 'Tomas')
    const submit = screen.getByRole('button', { name: /verbind opnieuw/i })
    await userEvent.click(submit)

    expect(submit).toBeDisabled()

    resolve()
    await vi.waitFor(() => expect(submit).toBeEnabled())
  })

  it('roept onBack aan via Terug', async () => {
    const onBack = vi.fn()
    render(<ReclaimPlayerStep onSubmit={vi.fn()} onBack={onBack} />)

    await userEvent.click(screen.getByRole('button', { name: /terug/i }))

    expect(onBack).toHaveBeenCalledOnce()
  })
})
