import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ArmyStepperRow } from './ArmyStepperRow'

const color = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' }

describe('ArmyStepperRow', () => {
  it('incrementOnly: toont één +-knop en geen decrement-knop', async () => {
    const onIncrement = vi.fn()
    render(
      <ArmyStepperRow
        incrementOnly
        color={color}
        label="Alaska"
        armyCount={2}
        canIncrement
        onIncrement={onIncrement}
        incrementLabel="Leger plaatsen op Alaska"
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Leger plaatsen op Alaska' }))
    expect(onIncrement).toHaveBeenCalledOnce()
  })

  it('incrementOnly: schakelt de +-knop uit als canIncrement false is', () => {
    render(
      <ArmyStepperRow
        incrementOnly
        color={color}
        label="Alaska"
        armyCount={5}
        canIncrement={false}
        onIncrement={vi.fn()}
        incrementLabel="Leger plaatsen op Alaska"
      />,
    )

    expect(screen.getByRole('button', { name: 'Leger plaatsen op Alaska' })).toBeDisabled()
  })

  it('volwaardige stepper: +/− roepen onIncrement/onDecrement aan en tonen base → total', async () => {
    const onIncrement = vi.fn()
    const onDecrement = vi.fn()
    render(
      <ArmyStepperRow
        incrementOnly={false}
        color={color}
        label="Alaska"
        armyCount={6}
        baseArmyCount={4}
        delta={2}
        canIncrement
        canDecrement
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        incrementLabel="Leger plaatsen op Alaska"
        decrementLabel="Leger terugnemen van Alaska"
      />,
    )

    expect(screen.getByText('4 →')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Leger plaatsen op Alaska' }))
    expect(onIncrement).toHaveBeenCalledOnce()

    await userEvent.click(screen.getByRole('button', { name: 'Leger terugnemen van Alaska' }))
    expect(onDecrement).toHaveBeenCalledOnce()
  })

  it('volwaardige stepper: schakelt −-knop uit als canDecrement false is', () => {
    render(
      <ArmyStepperRow
        incrementOnly={false}
        color={color}
        label="Alaska"
        armyCount={4}
        baseArmyCount={4}
        delta={0}
        canIncrement
        canDecrement={false}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        incrementLabel="Leger plaatsen op Alaska"
        decrementLabel="Leger terugnemen van Alaska"
      />,
    )

    expect(screen.getByRole('button', { name: 'Leger terugnemen van Alaska' })).toBeDisabled()
  })
})
