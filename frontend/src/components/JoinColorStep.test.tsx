import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinColorStep } from './JoinColorStep'

const colors = [
  { id: 'red', name: 'Rood', hex: '#C0392B', symbol: 'circle' },
  { id: 'blue', name: 'Blauw', hex: '#215C9C', symbol: 'square' },
]

describe('JoinColorStep', () => {
  it('blokkeert een bezette kleur en roept onPick aan voor een vrije kleur', async () => {
    const onPick = vi.fn()
    render(
      <JoinColorStep
        colors={colors}
        takenColorIds={['red']}
        selectedColorId={null}
        onPick={onPick}
      />,
    )

    expect(screen.getByRole('radio', { name: /rood/i })).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /blauw/i }))
    expect(onPick).toHaveBeenCalledWith('blue')
  })
})
