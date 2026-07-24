import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LobbySettingsSummary } from './LobbySettingsSummary'
import { RoleAssignmentModeDto, SetupModeDto, WinConditionDto } from '../types/GameSettings'

describe('LobbySettingsSummary', () => {
  it('vertaalt de instellingen naar leesbare rijen', () => {
    render(
      <LobbySettingsSummary
        settings={{
          winCondition: WinConditionDto.SecretMissions,
          setupMode: SetupModeDto.Random,
          startingArmies: 30,
          turnTimerSeconds: 180,
          fortifyTimerSeconds: 60,
          rolesEnabled: false,
          roleAssignment: RoleAssignmentModeDto.Random,
          eventsEnabled: false,
        }}
      />,
    )

    expect(screen.getByText('Geheime missies')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('3 min')).toBeInTheDocument()
    expect(screen.getByText('1 min')).toBeInTheDocument()
    expect(screen.getAllByText('Uit')).toHaveLength(2)
  })
})
