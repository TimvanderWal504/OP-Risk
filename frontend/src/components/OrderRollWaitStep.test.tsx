import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OrderRollWaitStep } from './OrderRollWaitStep'

describe('OrderRollWaitStep', () => {
  it('toont de gooien-knop zolang de order-roll nog niet afgerond is', async () => {
    const onRoll = vi.fn()
    render(<OrderRollWaitStep myDice={undefined} canRoll onRoll={onRoll} />)

    expect(screen.getByText('Je hebt nog niet gegooid.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /gooien/i }))
    expect(onRoll).toHaveBeenCalled()
  })

  it('toont de eigen worp zodra die binnen is', () => {
    render(<OrderRollWaitStep myDice={[6, 4]} canRoll={false} onRoll={vi.fn()} />)

    expect(screen.getAllByRole('img', { name: /dobbelsteen/i })).toHaveLength(2)
    expect(screen.getByText('Wachten op andere spelers…')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /gooien/i })).not.toBeInTheDocument()
  })

  it('toont een foutmelding als de server een poging afwijst', () => {
    render(<OrderRollWaitStep myDice={undefined} canRoll onRoll={vi.fn()} error="Speler hoeft nu niet te werpen." />)

    expect(screen.getByText('Speler hoeft nu niet te werpen.')).toBeInTheDocument()
  })
})
