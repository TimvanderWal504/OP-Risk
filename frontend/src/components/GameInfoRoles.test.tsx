import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameInfoRoles } from './GameInfoRoles'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'
import { RoleAssignmentModeDto } from '../types/GameSettings'
import type { GameStateDto } from '../types/GameState'

const [alice, bob] = fixtureState.players

const state = (overrides: Partial<GameStateDto> = {}): GameStateDto => ({
  ...fixtureState,
  settings: { ...fixtureState.settings, rolesEnabled: true },
  roles: [
    { id: 'president', name: 'President', description: '', originTerritory: 'eastern-united-states' },
    { id: 'generaal', name: 'Generaal', description: '', originTerritory: 'china' },
    { id: 'safariranger', name: 'Safariranger', description: '', originTerritory: 'east-africa' },
  ],
  players: [
    { ...alice, roleId: 'generaal', isRoleActive: true },
    { ...bob, roleId: 'president', isRoleActive: false },
  ],
  ...overrides,
})

describe('GameInfoRoles', () => {
  it('zet de eigen rol bovenaan onder "Jouw rol", de rest onder "Overige rollen"', () => {
    const s = state()
    render(<GameInfoRoles state={s} me={s.players[0]} />)

    const headings = screen.getAllByText(/^(Jouw rol|Overige rollen)$/).map((element) => element.textContent)
    expect(headings).toEqual(['Jouw rol', 'Overige rollen'])
    const names = screen.getAllByText(/^(President|Generaal|Safariranger)$/).map((element) => element.textContent)
    expect(names[0]).toBe('Generaal')
  })

  it('toont per rol herkomstland, houder en of de rol actief is', () => {
    const s = state()
    render(<GameInfoRoles state={s} me={s.players[0]} />)

    expect(screen.getByText('Herkomstland: China · Rol van Alice')).toBeInTheDocument()
    expect(screen.getByText(/Rol van Bob/)).toBeInTheDocument()
    expect(screen.getByText(/Niet uitgedeeld/)).toBeInTheDocument()
    expect(screen.getByText('actief')).toBeInTheDocument()
    expect(screen.getByText('inactief')).toBeInTheDocument()
  })

  it.each([
    [RoleAssignmentModeDto.Random, 'De rollen zijn willekeurig verdeeld.'],
    [RoleAssignmentModeDto.Choose, 'Iedereen heeft zelf een rol gekozen.'],
  ])('noemt hoe de rollen verdeeld zijn (%i)', (roleAssignment, text) => {
    const s = state({ settings: { ...fixtureState.settings, rolesEnabled: true, roleAssignment } })
    render(<GameInfoRoles state={s} me={s.players[0]} />)

    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('zonder eigen rol: geen "Jouw rol" en alle rollen onder "Rollen"', () => {
    const s = state({ players: [{ ...alice, roleId: null }, { ...bob, roleId: 'president' }] })
    render(<GameInfoRoles state={s} me={s.players[0]} />)

    expect(screen.queryByText('Jouw rol')).not.toBeInTheDocument()
    expect(screen.getByText('Rollen')).toBeInTheDocument()
  })
})
