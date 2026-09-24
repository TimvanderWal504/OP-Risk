import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameInfoRules } from './GameInfoRules'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'
import { EventDurationDto, type GameStateDto } from '../types/GameState'
import {
  DefenseDiceRuleDto,
  MissionWinTimingDto,
  SetupModeDto,
  WinConditionDto,
  type GameSettingsDto,
} from '../types/GameSettings'

const state = (settings: Partial<GameSettingsDto> = {}, overrides: Partial<GameStateDto> = {}): GameStateDto => ({
  ...fixtureState,
  settings: { ...fixtureState.settings, ...settings },
  continents: [
    { id: 'australia', bonus: 2, ownerPlayerId: null },
    { id: 'asia', bonus: 7, ownerPlayerId: null },
  ],
  events: [
    { id: 'goede-oogst', duration: EventDurationDto.Instant },
    { id: 'stormachtige-zeeen', duration: EventDurationDto.OneRound },
  ],
  nextCardTradeValue: 8,
  startingArmies: 35,
  ...overrides,
})

describe('GameInfoRules', () => {
  describe('winconditie', () => {
    it('Werelddominantie: alleen het veroverdoel, geen missie-uitleg', () => {
      render(<GameInfoRules state={state({ winCondition: WinConditionDto.WorldDomination })} />)

      expect(screen.getByText(/Verover alle gebieden op de kaart/)).toBeInTheDocument()
      expect(screen.queryByText(/geheime missie/)).not.toBeInTheDocument()
    })

    it.each([
      [MissionWinTimingDto.EndOfTurn, /dan win je meteen/],
      [MissionWinTimingDto.StartOfNextTurn, /Niemand ziet dat dit loopt/],
      [MissionWinTimingDto.FullRoundRevealed, /Iedereen ziet wie er op het punt staat te winnen/],
    ])('Geheime missies: toont alleen de gekozen timing (%i)', (timing, expected) => {
      render(
        <GameInfoRules state={state({ winCondition: WinConditionDto.SecretMissions, missionWinTiming: timing })} />,
      )

      expect(screen.getByText(/Vervul je geheime missie/)).toBeInTheDocument()
      expect(screen.getByText(expected)).toBeInTheDocument()
      expect(screen.getAllByText(/Vervul je je missie/)).toHaveLength(1)
    })
  })

  it.each([
    [SetupModeDto.Random, /willekeurig verdeeld/, /claimt iedereen/],
    [SetupModeDto.Claiming, /claimt iedereen/, /willekeurig verdeeld/],
  ])('startopstelling: alleen de gekozen variant (%i)', (setupMode, shown, hidden) => {
    render(<GameInfoRules state={state({ setupMode })} />)

    expect(screen.getByText(shown)).toBeInTheDocument()
    expect(screen.queryByText(hidden)).not.toBeInTheDocument()
  })

  it('startlegers: het gekozen preset met het aantal van de server, of niets zonder aantal', () => {
    const { unmount } = render(<GameInfoRules state={state({ startingArmiesPresetId: 'modern' })} />)
    expect(screen.getByText('Startlegers volgens Modern: in dit spel begint iedereen met 35 legers.')).toBeInTheDocument()
    unmount()

    render(<GameInfoRules state={state({}, { startingArmies: null })} />)
    expect(screen.queryByText(/Startlegers volgens/)).not.toBeInTheDocument()
  })

  it('timers: de ingestelde tijden', () => {
    render(<GameInfoRules state={state({ turnTimerSeconds: 150, fortifyTimerSeconds: 60 })} />)

    expect(screen.getByText(/heb je 2:30 min, voor verplaatsen 1 min/)).toBeInTheDocument()
  })

  it('versterken: voorbeeld met het ruimste continent en de inlegwaarde van de server', () => {
    render(<GameInfoRules state={state()} />)

    expect(screen.getByText(/Voorbeeld: met 14 gebieden krijg je 4 legers/)).toBeInTheDocument()
    expect(screen.getByText(/Voorbeeld: Azië levert 7 extra op/)).toBeInTheDocument()
    expect(screen.getByText(/de volgende set levert nu 8 legers op/)).toBeInTheDocument()
  })

  it.each([
    [true, 1],
    [false, 0],
  ])('rollen %s: rolverwijzingen alleen als rollen aan staan', (rolesEnabled, count) => {
    render(<GameInfoRules state={state({ rolesEnabled, defenseDiceRule: DefenseDiceRuleDto.HouseRule })} />)

    expect(screen.queryAllByText(/zie het tabblad Rollen/)).toHaveLength(count)
    expect(screen.queryAllByText(/Met een verdedigingsrol/)).toHaveLength(count)
  })

  it('dobbelregel Klassiek: de klassieke zin en nooit de verdedigingsrol, ook met rollen aan', () => {
    render(<GameInfoRules state={state({ defenseDiceRule: DefenseDiceRuleDto.Classic, rolesEnabled: true })} />)

    expect(screen.getByText(/mag hij altijd met 2 verdedigen/)).toBeInTheDocument()
    expect(screen.queryByText(/ook met 1\./)).not.toBeInTheDocument()
    expect(screen.queryByText(/Met een verdedigingsrol/)).not.toBeInTheDocument()
  })

  it('dobbelregel Huisregel: de huisregel-zin, niet de klassieke', () => {
    render(<GameInfoRules state={state({ defenseDiceRule: DefenseDiceRuleDto.HouseRule })} />)

    expect(screen.getByText(/verdedigt de verdediger ook met 1/)).toBeInTheDocument()
    expect(screen.queryByText(/mag hij altijd met 2 verdedigen/)).not.toBeInTheDocument()
  })

  it('gebeurtenissen aan: sectie met uitleg en de kaarten met hun duur', () => {
    render(<GameInfoRules state={state({ eventsEnabled: true })} />)

    expect(screen.getByText('Gebeurtenissen')).toBeInTheDocument()
    expect(screen.getByText('Goede oogst')).toBeInTheDocument()
    expect(screen.getByText('Direct')).toBeInTheDocument()
    expect(screen.getByText('1 ronde')).toBeInTheDocument()
  })

  it('gebeurtenissen uit: geen sectie en geen kaarten', () => {
    render(<GameInfoRules state={state({ eventsEnabled: false })} />)

    expect(screen.queryByText('Gebeurtenissen')).not.toBeInTheDocument()
    expect(screen.queryByText('Goede oogst')).not.toBeInTheDocument()
  })
})
