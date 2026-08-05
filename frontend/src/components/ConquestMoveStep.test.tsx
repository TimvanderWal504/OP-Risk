import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConquestMoveStep } from './ConquestMoveStep'

const myColor = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' }

describe('ConquestMoveStep', () => {
  it('start op het minimum (aantal gebruikte aanvalsdobbelstenen) en klemt op min/max', async () => {
    const user = userEvent.setup()

    render(
      <ConquestMoveStep
        fromTerritoryId="alaska"
        toTerritoryId="kamchatka"
        myColor={myColor}
        minArmies={2}
        maxArmies={3}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument()

    const decrement = screen.getByText('−')
    expect(decrement).toBeDisabled()

    await user.click(screen.getByText('+'))
    expect(screen.getByText('3')).toBeInTheDocument()

    const increment = screen.getByText('+')
    expect(increment).toBeDisabled()
  })

  it('bevestigt met het geklemde aantal', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockResolvedValue(undefined)

    render(
      <ConquestMoveStep
        fromTerritoryId="alaska"
        toTerritoryId="kamchatka"
        myColor={myColor}
        minArmies={1}
        maxArmies={4}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByText('+'))
    await user.click(screen.getByText('+'))
    await user.click(screen.getByText('Bevestig'))

    expect(onConfirm).toHaveBeenCalledWith(3)
  })
})
