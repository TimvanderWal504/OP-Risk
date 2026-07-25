import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinRoleStep } from './JoinRoleStep'

const roles = [
  { id: 'smokkelaar', name: 'Smokkelaar', description: 'Herwerpt verloren dobbelstenen.' },
  { id: 'generaal', name: 'Generaal', description: 'Extra legers per beurt.' },
]

describe('JoinRoleStep', () => {
  it('blokkeert een bezette rol en roept onPick aan voor een vrije rol', async () => {
    const onPick = vi.fn()
    render(
      <JoinRoleStep
        roles={roles}
        takenRoleIds={['smokkelaar']}
        selectedRoleId={null}
        onPick={onPick}
      />,
    )

    expect(screen.getByRole('radio', { name: /smokkelaar/i })).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /generaal/i }))
    expect(onPick).toHaveBeenCalledWith('generaal')
  })
})
