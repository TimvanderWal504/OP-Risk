import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Stepper } from './Stepper'

describe('Stepper', () => {
  it('roept de juiste callback aan per knop', async () => {
    const onDecrement = vi.fn()
    const onIncrement = vi.fn()
    render(
      <Stepper
        label="Startlegers"
        sub="Per speler"
        value="20"
        onDecrement={onDecrement}
        onIncrement={onIncrement}
      />,
    )

    expect(screen.getByText('20')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /verlagen/i }))
    await userEvent.click(screen.getByRole('button', { name: /verhogen/i }))
    expect(onDecrement).toHaveBeenCalledTimes(1)
    expect(onIncrement).toHaveBeenCalledTimes(1)
  })

  it('grijst de −-knop uit op de ondergrens', () => {
    render(
      <Stepper
        label="Startlegers"
        sub="Per speler"
        value="10"
        canDecrement={false}
        onDecrement={vi.fn()}
        onIncrement={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /verlagen/i })).toBeDisabled()
  })
})
