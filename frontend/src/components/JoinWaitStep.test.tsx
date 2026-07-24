import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinWaitStep } from './JoinWaitStep'

const me = { id: '1', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false }

describe('JoinWaitStep', () => {
  it('toont voor de host de tv-url en een uitgeschakelde start-knop als canStart false is', () => {
    render(
      <JoinWaitStep
        gameId="ABC123"
        me={me}
        color={{ id: 'red', name: 'Rood', hex: '#C0392B', symbol: 'circle' }}
        role={null}
        joinedCount={1}
        isHost
        canStart={false}
        onStart={vi.fn()}
      />,
    )

    expect(screen.getByText(/tv\/ABC123/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /spel starten/i })).toBeDisabled()
  })

  it('roept onStart aan zodra canStart true is', async () => {
    const onStart = vi.fn()
    render(
      <JoinWaitStep
        gameId="ABC123"
        me={me}
        color={null}
        role={null}
        joinedCount={2}
        isHost
        canStart
        onStart={onStart}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /spel starten/i }))
    expect(onStart).toHaveBeenCalled()
  })

  it('toont geen start-knop voor een niet-host', () => {
    render(
      <JoinWaitStep
        gameId="ABC123"
        me={{ ...me, isHost: false }}
        color={null}
        role={null}
        joinedCount={2}
        isHost={false}
        canStart={false}
        onStart={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /spel starten/i })).not.toBeInTheDocument()
  })
})
