import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectableOption } from './SelectableOption'

describe('SelectableOption', () => {
  it('roept onSelect aan en zet aria-checked bij selectie', async () => {
    const onSelect = vi.fn()
    render(
      <SelectableOption selected onSelect={onSelect}>
        Blauw
      </SelectableOption>,
    )

    const option = screen.getByRole('radio', { name: 'Blauw' })
    expect(option).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(option)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('blokkeert selectie wanneer disabled', async () => {
    const onSelect = vi.fn()
    render(
      <SelectableOption selected={false} disabled onSelect={onSelect}>
        Rood
      </SelectableOption>,
    )

    const option = screen.getByRole('radio', { name: 'Rood' })
    expect(option).toBeDisabled()
    await userEvent.click(option)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
