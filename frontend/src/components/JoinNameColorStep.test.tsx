import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinNameColorStep } from './JoinNameColorStep'

const colors = [
  { id: 'red', name: 'Rood', hex: '#C0392B', onHex: '#FFFFFF', symbol: 'circle' },
  { id: 'blue', name: 'Blauw', hex: '#215C9C', onHex: '#FFFFFF', symbol: 'square' },
]

describe('JoinNameColorStep', () => {
  it('blokkeert een bezette kleur', () => {
    render(
      <JoinNameColorStep
        colors={colors}
        takenColorIds={['red']}
        onSubmit={vi.fn()}
        stepIndex={0}
        stepCount={2}
      />,
    )

    expect(screen.getByRole('radio', { name: /rood/i })).toBeDisabled()
  })

  it('houdt de knop uit tot zowel naam als kleur ingevuld zijn, en roept dan onSubmit aan', async () => {
    const onSubmit = vi.fn()
    render(
      <JoinNameColorStep
        colors={colors}
        takenColorIds={['red']}
        onSubmit={onSubmit}
        stepIndex={0}
        stepCount={2}
      />,
    )

    const nextButton = screen.getByRole('button', { name: /volgende/i })
    expect(nextButton).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText(/jouw naam/i), 'Tomas')
    expect(nextButton).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /blauw/i }))
    expect(nextButton).toBeEnabled()

    await userEvent.click(nextButton)
    expect(onSubmit).toHaveBeenCalledWith('Tomas', 'blue')
  })

  it('toont een vaste naam zonder invoerveld wanneer fixedName is meegegeven', () => {
    render(
      <JoinNameColorStep
        colors={colors}
        takenColorIds={[]}
        onSubmit={vi.fn()}
        stepIndex={0}
        stepCount={2}
        fixedName="Tomas"
      />,
    )

    expect(screen.getByText('Tomas')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/jouw naam/i)).not.toBeInTheDocument()
  })
})
