import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LobbySettingsSummary } from './LobbySettingsSummary'
import {
  DefenseDiceRuleDto,
  MissionWinTimingDto,
  RoleAssignmentModeDto,
  SetupModeDto,
  WinConditionDto,
  type GameSettingsDto,
} from '../types/GameSettings'

const settings: GameSettingsDto = {
  winCondition: WinConditionDto.SecretMissions,
  setupMode: SetupModeDto.Random,
  startingArmiesPresetId: 'classic',
  turnTimerSeconds: 180,
  fortifyTimerSeconds: 60,
  rolesEnabled: false,
  roleAssignment: RoleAssignmentModeDto.Random,
  eventsEnabled: false,
  missionWinTiming: MissionWinTimingDto.EndOfTurn,
  defenseDiceRule: DefenseDiceRuleDto.HouseRule,
}

describe('LobbySettingsSummary', () => {
  it('vertaalt de instellingen naar leesbare rijen', () => {
    render(<LobbySettingsSummary settings={settings} mapId="standaard-43" territoryCount={43} />)

    expect(screen.getByText('Kaart')).toBeInTheDocument()
    expect(screen.getByText('Standaard · 43 gebieden')).toBeInTheDocument()
    expect(screen.getByText('Geheime missies')).toBeInTheDocument()
    expect(screen.getByText('Klassiek')).toBeInTheDocument()
    expect(screen.getByText('3 min')).toBeInTheDocument()
    expect(screen.queryByText('1 min')).not.toBeInTheDocument()
    expect(screen.getAllByText('Uit')).toHaveLength(2)
    expect(screen.getByText('Dobbelregel')).toBeInTheDocument()
    expect(screen.getByText('Huisregel')).toBeInTheDocument()
  })

  it('toont de kaart van dit spel, niet een vaste kaart (FO §4.5)', () => {
    render(<LobbySettingsSummary settings={settings} mapId="wereld-49" territoryCount={49} />)

    expect(screen.getByText('Wereld · 49 gebieden')).toBeInTheDocument()
  })
})
