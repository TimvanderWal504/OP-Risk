import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinNameStep } from './JoinNameStep'

describe('JoinNameStep', () => {
  it('roept onSubmit met de getrimde naam aan', async () => {
    const onSubmit = vi.fn()
    render(<JoinNameStep onSubmit={onSubmit} />)

    await userEvent.type(screen.getByPlaceholderText('Jouw naam'), '  Alice  ')
    await userEvent.click(screen.getByRole('button', { name: /volgende/i }))

    expect(onSubmit).toHaveBeenCalledWith('Alice')
  })

  it('de knop is uitgeschakeld zonder naam', () => {
    render(<JoinNameStep onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: /volgende/i })).toBeDisabled()
  })
})
