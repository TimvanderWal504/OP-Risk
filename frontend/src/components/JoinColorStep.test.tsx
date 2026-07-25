import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinColorStep } from './JoinColorStep'

const colors = [
  { id: 'red', name: 'Rood', hex: '#C0392B', onHex: '#FFFFFF', symbol: 'circle' },
  { id: 'blue', name: 'Blauw', hex: '#215C9C', onHex: '#FFFFFF', symbol: 'square' },
]

describe('JoinColorStep', () => {
  it('blokkeert een bezette kleur', () => {
    render(
      <JoinColorStep
        colors={colors}
        takenColorIds={['red']}
        onPick={vi.fn()}
        stepIndex={1}
        stepCount={3}
      />,
    )

    expect(screen.getByRole('radio', { name: /rood/i })).toBeDisabled()
  })

  it('roept onPick pas aan na selecteren én bevestigen', async () => {
    const onPick = vi.fn()
    render(
      <JoinColorStep
        colors={colors}
        takenColorIds={['red']}
        onPick={onPick}
        stepIndex={1}
        stepCount={3}
      />,
    )

    const confirmButton = screen.getByRole('button', { name: /kies deze kleur/i })
    expect(confirmButton).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /blauw/i }))
    expect(onPick).not.toHaveBeenCalled()
    expect(confirmButton).toBeEnabled()

    await userEvent.click(confirmButton)
    expect(onPick).toHaveBeenCalledWith('blue')
  })
})
