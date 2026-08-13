import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TurnStatusHeader } from './TurnStatusHeader'
import { TurnPhaseDto } from '../../types/GameState'

const player = { id: '1', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false }
const color = { id: 'red', name: 'Rood', hex: '#800020', onHex: '#f9a8a8', symbol: 'circle' }

describe('TurnStatusHeader', () => {
  it('toont de actieve speler en de resterende tijd geformatteerd als m:ss', () => {
    render(
      <TurnStatusHeader
        activePlayer={player}
        activeColor={color}
        turnPhase={TurnPhaseDto.Reinforce}
        timer={{ remainingMs: 167_000, isPaused: false }}
      />,
    )

    expect(screen.getByText(/Aan de beurt: Alice/)).toBeInTheDocument()
    expect(screen.getByText('· Rood')).toBeInTheDocument()
    expect(screen.getByText('2:47')).toBeInTheDocument()
  })

  it('markeert de actieve TurnPhase en laat de andere twee als inactief zien', () => {
    render(
      <TurnStatusHeader
        activePlayer={player}
        activeColor={color}
        turnPhase={TurnPhaseDto.Attack}
        timer={{ remainingMs: 60_000, isPaused: false }}
      />,
    )

    expect(screen.getByText('Aanvallen')).toBeInTheDocument()
    expect(screen.getByText('Versterken')).toBeInTheDocument()
    expect(screen.getByText('Verplaatsen')).toBeInTheDocument()
  })

  it('toont "Gepauzeerd" i.p.v. een aftellende waarde als de timer gepauzeerd is', () => {
    render(
      <TurnStatusHeader
        activePlayer={player}
        activeColor={color}
        turnPhase={TurnPhaseDto.Reinforce}
        timer={{ remainingMs: 45_000, isPaused: true }}
      />,
    )

    expect(screen.getByText('Gepauzeerd')).toBeInTheDocument()
    expect(screen.queryByText('0:45')).not.toBeInTheDocument()
  })

  it('valt terug op 0:00 als er nog geen timer is', () => {
    render(
      <TurnStatusHeader activePlayer={player} activeColor={color} turnPhase={TurnPhaseDto.Reinforce} timer={null} />,
    )

    expect(screen.getByText('0:00')).toBeInTheDocument()
  })
})
