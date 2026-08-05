import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GamePhaseDto, TurnPhaseDto, type GameStateDto, type PendingCombatDto } from '../../../types/GameState'
import { fixtureState, fixtureProps } from './phoneScreenFixture'
import { PhoneAttackScreen } from './PhoneAttackScreen'
import { resolveAttackRole } from './resolveAttackRole'

const pendingCombat: PendingCombatDto = { fromTerritoryId: 'alaska', toTerritoryId: 'kamchatka', attackDice: 2 }

const attackState = (options: {
  activePlayerId: string
  pendingCombat: PendingCombatDto | null
  toTerritoryOwnerId: string | null
}): GameStateDto => ({
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  territories: [
    { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 4 },
    { territoryId: 'kamchatka', ownerPlayerId: options.toTerritoryOwnerId, armyCount: 2 },
  ],
  turnState: {
    activePlayerId: options.activePlayerId,
    turnPhase: TurnPhaseDto.Attack,
    armiesRemaining: 0,
    pendingCombat: options.pendingCombat,
    timer: { remainingMs: 60_000, isPaused: options.pendingCombat !== null },
    reinforcementBreakdown: null,
  },
})

describe('resolveAttackRole', () => {
  it.each<[string, Parameters<typeof attackState>[0], string, string]>([
    [
      'net veroverd: actief en bezit toTerritoryId al (eigendom al gewisseld in de snapshot)',
      { activePlayerId: 'alice', pendingCombat, toTerritoryOwnerId: 'alice' },
      'alice',
      'conquest-move',
    ],
    [
      'aanvaller, wachtend op verdediger: actief maar bezit toTerritoryId niet',
      { activePlayerId: 'alice', pendingCombat, toTerritoryOwnerId: 'bob' },
      'alice',
      'attacker',
    ],
    [
      'verdediger: bezit toTerritoryId, niet actief',
      { activePlayerId: 'alice', pendingCombat, toTerritoryOwnerId: 'bob' },
      'bob',
      'defending',
    ],
    [
      'omstander: geen van bovenstaande (derde speler tijdens andermans gevecht)',
      { activePlayerId: 'alice', pendingCombat, toTerritoryOwnerId: 'bob' },
      'carol',
      'bystander',
    ],
    [
      'aanvaller, vrij om te kiezen: geen pendingCombat, wel actief',
      { activePlayerId: 'alice', pendingCombat: null, toTerritoryOwnerId: 'bob' },
      'alice',
      'attacker',
    ],
    [
      'omstander: geen pendingCombat, niet actief',
      { activePlayerId: 'alice', pendingCombat: null, toTerritoryOwnerId: 'bob' },
      'bob',
      'bystander',
    ],
  ])('%s', (_label, options, playerId, expected) => {
    const state = attackState(options)

    expect(resolveAttackRole(state, playerId)).toBe(expected)
  })

  it('valt terug op bystander zolang turnState nog niet gezet is', () => {
    expect(resolveAttackRole({ ...fixtureState, turnState: null }, 'alice')).toBe('bystander')
  })
})

describe('PhoneAttackScreen', () => {
  it('rendert de meeverplaats-stap zodra de speler net veroverd heeft', () => {
    // Post-conquest snapshot: eigendom is al gewisseld naar de aanvaller.
    const state = attackState({ activePlayerId: 'alice', pendingCombat, toTerritoryOwnerId: 'alice' })

    render(<PhoneAttackScreen {...fixtureProps({ state, playerId: 'alice', me: state.players[0] })} />)

    expect(screen.getByText('Veroverd!')).toBeInTheDocument()
  })

  it('rendert de omstander-weergave voor een niet-betrokken speler', () => {
    // "bob" bezit hier het doelgebied (kamchatka) en is dus de verdediger, niet de omstander —
    // een echte omstander is een derde speler die noch aanvaller noch verdediger is.
    const carol = { id: 'carol', name: 'Carol', colorId: null, roleId: null, isHost: false, isEliminated: false }
    const state = {
      ...attackState({ activePlayerId: 'alice', pendingCombat, toTerritoryOwnerId: 'bob' }),
      players: [...fixtureState.players, carol],
    }

    render(<PhoneAttackScreen {...fixtureProps({ state, playerId: 'carol', me: carol })} />)

    expect(screen.getByText('· Aanvallen')).toBeInTheDocument()
  })
})
