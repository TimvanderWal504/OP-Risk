import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { fixtureProps, fixtureState } from './phoneScreenFixture'
import { PhoneOrderRollScreen } from './PhoneOrderRollScreen'

describe('PhoneOrderRollScreen', () => {
  it('laat gooien zodra de server aangeeft dat er nog gegooid mag worden', async () => {
    const rollForOrder = vi.fn()
    render(
      <PhoneOrderRollScreen
        {...fixtureProps({
          state: { ...fixtureState, orderRollState: { playersStillToRoll: ['alice'] } },
          rollForOrder,
        })}
      />,
    )

    expect(screen.getByText('Wie mag beginnen?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Gooien' }))

    expect(rollForOrder).toHaveBeenCalled()
  })

  it('toont geen worpknop zolang de server geen order-roll-state stuurt', () => {
    render(<PhoneOrderRollScreen {...fixtureProps({ state: { ...fixtureState, orderRollState: null } })} />)

    expect(screen.queryByRole('button', { name: 'Gooien' })).not.toBeInTheDocument()
  })
})
