import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinHostWaitStep } from './JoinHostWaitStep'

const colors = [{ id: 'red', name: 'Rood', hex: '#C0392B', onHex: '#FFFFFF', symbol: 'circle' }]

const players = [
  { id: '1', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false },
  { id: '2', name: 'Bob', colorId: null, roleId: null, isHost: false, isEliminated: false },
]

describe('JoinHostWaitStep', () => {
  it('toont de aangesloten spelers en de teller', () => {
    render(
      <JoinHostWaitStep
        players={players}
        colors={colors}
        maxPlayers={7}
        canStart={false}
        onStart={vi.fn()}
      />,
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('2 / 7')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /wachten op spelers/i })).toBeDisabled()
  })

  it('roept onStart aan zodra canStart true is', async () => {
    const onStart = vi.fn()
    render(
      <JoinHostWaitStep
        players={players}
        colors={colors}
        maxPlayers={7}
        canStart
        onStart={onStart}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /start spel/i }))
    expect(onStart).toHaveBeenCalled()
  })
})
