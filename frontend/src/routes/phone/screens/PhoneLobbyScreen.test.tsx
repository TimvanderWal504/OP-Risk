import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RoleAssignmentModeDto } from '../../../types/GameSettings'
import { fixtureProps, fixtureState } from './phoneScreenFixture'
import { PhoneLobbyScreen } from './PhoneLobbyScreen'

const withRoles = {
  ...fixtureState,
  roles: [
    { id: 'general', name: 'Generaal', description: 'Meer legers', originTerritory: 'alaska' },
    { id: 'admiral', name: 'Admiraal', description: 'Over zee', originTerritory: 'brazil' },
  ],
  settings: {
    ...fixtureState.settings,
    rolesEnabled: true,
    roleAssignment: RoleAssignmentModeDto.Choose,
  },
}

describe('PhoneLobbyScreen', () => {
  it('vraagt eerst om een kleur zolang de speler er geen heeft', () => {
    render(
      <PhoneLobbyScreen
        {...fixtureProps({ me: { ...fixtureState.players[0], colorId: null } })}
      />,
    )

    expect(screen.getByText('Kies je kleur')).toBeInTheDocument()
  })

  it('vraagt daarna om een rol als de lobby op Kiezen staat', () => {
    render(<PhoneLobbyScreen {...fixtureProps({ state: withRoles })} />)

    expect(screen.getByText('Kies je rol')).toBeInTheDocument()
  })

  it('laat vanaf de rolstap terug naar de kleurkeuze', async () => {
    render(<PhoneLobbyScreen {...fixtureProps({ state: withRoles })} />)

    await userEvent.click(screen.getByRole('button', { name: 'Naam & kleur aanpassen' }))

    expect(screen.getByText('Kies je kleur')).toBeInTheDocument()
  })

  it('geeft de host het startscherm', async () => {
    const startGame = vi.fn()
    render(<PhoneLobbyScreen {...fixtureProps({ startGame })} />)

    expect(screen.getByText('Wachten op spelers')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /start/i }))

    expect(startGame).toHaveBeenCalled()
  })

  it('laat een niet-host wachten', () => {
    render(<PhoneLobbyScreen {...fixtureProps({ me: fixtureState.players[1], playerId: 'bob' })} />)

    expect(screen.getByText('Je zit in de lobby')).toBeInTheDocument()
  })
})
