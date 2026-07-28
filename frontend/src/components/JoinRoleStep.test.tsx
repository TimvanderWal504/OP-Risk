import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinRoleStep } from './JoinRoleStep'

const roles = [
  { id: 'smokkelaar', name: 'Smokkelaar', description: 'Herwerpt verloren dobbelstenen.', originTerritory: 'north-africa' },
  { id: 'generaal', name: 'Generaal', description: 'Extra legers per beurt.', originTerritory: 'china' },
]

describe('JoinRoleStep', () => {
  it('blokkeert een bezette rol en toont een placeholder zolang niets gekozen is', () => {
    render(
      <JoinRoleStep
        roles={roles}
        takenRoleIds={['smokkelaar']}
        onPick={vi.fn()}
        onBack={vi.fn()}
        stepIndex={1}
        stepCount={3}
      />,
    )

    expect(screen.getByRole('radio', { name: /smokkelaar/i })).toBeDisabled()
    expect(screen.getByText('Kies eerst een rol')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /bevestigen/i })).not.toBeInTheDocument()
  })

  it('roept onPick pas aan na selecteren én bevestigen', async () => {
    const onPick = vi.fn()
    render(
      <JoinRoleStep
        roles={roles}
        takenRoleIds={['smokkelaar']}
        onPick={onPick}
        onBack={vi.fn()}
        stepIndex={1}
        stepCount={3}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: /generaal/i }))
    expect(onPick).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /bevestigen/i }))
    expect(onPick).toHaveBeenCalledWith('generaal')
  })

  it('roept onBack aan bij het klikken op de terugknop', async () => {
    const onBack = vi.fn()
    render(
      <JoinRoleStep
        roles={roles}
        takenRoleIds={[]}
        onPick={vi.fn()}
        onBack={onBack}
        stepIndex={1}
        stepCount={3}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /naam & kleur aanpassen/i }))
    expect(onBack).toHaveBeenCalled()
  })
})
