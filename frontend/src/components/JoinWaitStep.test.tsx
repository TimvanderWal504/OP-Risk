import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { JoinWaitStep } from './JoinWaitStep'

const me = { id: '1', name: 'Alice', colorId: 'red', roleId: null, isHost: false, isEliminated: false }

describe('JoinWaitStep', () => {
  it('toont naam, kleur en het aantal aangesloten spelers', () => {
    render(
      <JoinWaitStep
        me={me}
        color={{ id: 'red', name: 'Rood', hex: '#C0392B', onHex: '#FFFFFF', symbol: 'circle' }}
        role={null}
        joinedCount={3}
        stepIndex={3}
        stepCount={3}
      />,
    )

    expect(screen.getByText(/Alice/)).toBeInTheDocument()
    expect(screen.getByText(/3 spelers aangesloten/)).toBeInTheDocument()
  })

  it('toont de rol met herkomstland als er een gekozen is', () => {
    render(
      <JoinWaitStep
        me={{ ...me, roleId: 'generaal' }}
        color={null}
        role={{ id: 'generaal', name: 'Generaal', description: 'Extra legers per beurt.', originTerritory: 'china' }}
        joinedCount={1}
        stepIndex={2}
        stepCount={3}
      />,
    )

    expect(screen.getByText(/Generaal/)).toBeInTheDocument()
  })
})
