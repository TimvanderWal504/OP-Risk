import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinRoleStep } from './JoinRoleStep'

const roles = [
  { id: 'smokkelaar', name: 'Smokkelaar', description: 'Herwerpt verloren dobbelstenen.' },
  { id: 'generaal', name: 'Generaal', description: 'Extra legers per beurt.' },
]

describe('JoinRoleStep', () => {
  it('blokkeert een bezette rol en toont een placeholder zolang niets gekozen is', () => {
    render(
      <JoinRoleStep
        roles={roles}
        takenRoleIds={['smokkelaar']}
        onPick={vi.fn()}
        stepIndex={2}
        stepCount={4}
      />,
    )

    expect(screen.getByRole('radio', { name: /smokkelaar/i })).toBeDisabled()
    expect(screen.getByText('Kies eerst een rol')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /kies deze rol/i })).not.toBeInTheDocument()
  })

  it('roept onPick pas aan na selecteren én bevestigen', async () => {
    const onPick = vi.fn()
    render(
      <JoinRoleStep
        roles={roles}
        takenRoleIds={['smokkelaar']}
        onPick={onPick}
        stepIndex={2}
        stepCount={4}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: /generaal/i }))
    expect(onPick).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /kies deze rol/i }))
    expect(onPick).toHaveBeenCalledWith('generaal')
  })
})
