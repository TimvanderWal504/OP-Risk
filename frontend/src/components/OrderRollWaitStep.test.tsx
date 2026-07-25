import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OrderRollWaitStep } from './OrderRollWaitStep'

describe('OrderRollWaitStep', () => {
  it('toont de gooien-knop en dobbelsteen-placeholders zolang er nog niet gegooid is', async () => {
    const onRoll = vi.fn()
    render(
      <OrderRollWaitStep myDice={undefined} colorHex="#ca3c25" colorOnHex="#fffbbd" canRoll onRoll={onRoll} />,
    )

    expect(screen.getByLabelText("Je hebt nog niet gegooid.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /gooien/i }))
    expect(onRoll).toHaveBeenCalled()
  })

  it('toont de eigen worp in de eigen spelerskleur zodra die binnen is', () => {
    render(
      <OrderRollWaitStep myDice={[6, 4]} colorHex="#ca3c25" colorOnHex="#fffbbd" canRoll={false} onRoll={vi.fn()} />,
    )

    const dice = screen.getAllByRole('img', { name: /dobbelsteen/i })
    expect(dice).toHaveLength(2)
    expect(dice[0]).toHaveStyle({ background: '#ca3c25' })
    expect(screen.getByText('Wachten op andere spelers…')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /gooien/i })).not.toBeInTheDocument()
  })

  it('toont een foutmelding als de server een poging afwijst', () => {
    render(
      <OrderRollWaitStep
        myDice={undefined}
        colorHex="#ca3c25"
        colorOnHex="#fffbbd"
        canRoll
        onRoll={vi.fn()}
        error="Speler hoeft nu niet te werpen."
      />,
    )

    expect(screen.getByText('Speler hoeft nu niet te werpen.')).toBeInTheDocument()
  })
})
