import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GamePhaseDto } from '../../../types/GameState'
import { fixtureProps, fixtureState } from './phoneScreenFixture'
import { PhoneGameOverScreen } from './PhoneGameOverScreen'

const finishedState = { ...fixtureState, phase: GamePhaseDto.Finished }

describe('PhoneGameOverScreen', () => {
  it('toont een gepersonaliseerde tekst als de eigen speler gewonnen heeft, met de winnaar-achtergrond', () => {
    const { container } = render(<PhoneGameOverScreen {...fixtureProps({ state: { ...finishedState, winners: ['alice'] } })} />)

    expect(screen.getByText('Je hebt gewonnen!')).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).style.backgroundImage).toContain('phone-winner')
  })

  it('toont de naam van de winnaar als een ander won, met de eliminatie-achtergrond', () => {
    const { container } = render(<PhoneGameOverScreen {...fixtureProps({ state: { ...finishedState, winners: ['bob'] } })} />)

    expect(screen.getByText('Bob heeft gewonnen.')).toBeInTheDocument()
    expect((container.firstChild as HTMLElement).style.backgroundImage).toContain('phone-eliminated')
  })

  it('toont beide namen bij meerdere winnaars, geen van beide de eigen speler', () => {
    const otherPlayer = { id: 'carol', name: 'Carol', colorId: 'green', roleId: null, isRoleActive: false, isHost: false, isEliminated: false, hand: [], hasTradeableCardSet: false, handCount: 0, missionId: null }

    render(
      <PhoneGameOverScreen
        {...fixtureProps({
          state: { ...finishedState, players: [...finishedState.players, otherPlayer], winners: ['bob', 'carol'] },
        })}
      />,
    )

    expect(screen.getByText('Bob, Carol hebben gewonnen.')).toBeInTheDocument()
  })

  it('valt terug op een neutrale tekst bij lege of onbekende winners', () => {
    render(<PhoneGameOverScreen {...fixtureProps({ state: { ...finishedState, winners: ['onbekend'] } })} />)

    expect(screen.getByText('Spel afgelopen.')).toBeInTheDocument()
  })
})
