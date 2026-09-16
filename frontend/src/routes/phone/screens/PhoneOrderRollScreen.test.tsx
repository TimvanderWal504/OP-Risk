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

  it('toont wachtstatus i.p.v. worpknop als de speler zelf niet meer hoeft te gooien', () => {
    render(
      <PhoneOrderRollScreen
        {...fixtureProps({
          state: { ...fixtureState, orderRollState: { playersStillToRoll: ['bob'] } },
        })}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Gooien' })).not.toBeInTheDocument()
    expect(screen.getByText('Wachten op andere spelers…')).toBeInTheDocument()
  })

  it('toont de worpknop weer zodra de speler in een herworp-ronde weer mag gooien', () => {
    const { rerender } = render(
      <PhoneOrderRollScreen
        {...fixtureProps({
          state: { ...fixtureState, orderRollState: { playersStillToRoll: ['bob'] } },
        })}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Gooien' })).not.toBeInTheDocument()

    rerender(
      <PhoneOrderRollScreen
        {...fixtureProps({
          state: { ...fixtureState, orderRollState: { playersStillToRoll: ['alice', 'bob'] } },
        })}
      />,
    )
    expect(screen.getByRole('button', { name: 'Gooien' })).toBeInTheDocument()
  })

  it('toont wachtstatus als niemand meer hoeft te gooien', () => {
    render(
      <PhoneOrderRollScreen
        {...fixtureProps({
          state: { ...fixtureState, orderRollState: { playersStillToRoll: [] } },
        })}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Gooien' })).not.toBeInTheDocument()
    expect(screen.getByText('Wachten op andere spelers…')).toBeInTheDocument()
  })
})
