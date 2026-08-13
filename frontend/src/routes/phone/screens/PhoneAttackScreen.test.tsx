import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GamePhaseDto, TurnPhaseDto, type GameStateDto, type PendingCombatDto } from '../../../types/GameState'
import type { CombatBroadcastState } from '../../../hooks/useCombatBroadcast'
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

    expect(screen.getByText(/Kamtsjatka veroverd!/)).toBeInTheDocument()
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

    expect(screen.getByText('Aanvallen')).toBeInTheDocument()
  })

  it('houdt het eigen verdedigingsresultaat zichtbaar nadat ChooseDefenseDice de rol naar bystander laat kantelen, en dismisst het automatisch bij een nieuwe aanval', async () => {
    // Bevinding: `ChooseDefenseDice` maakt `pendingCombat` leeg in dezelfde snapshot als het
    // resultaat, waardoor `resolveAttackRole` meteen naar 'bystander' kantelt — zonder de
    // `heldDefend`-fix in `PhoneAttackScreen` zou `DefendStep` hier meteen verdwijnen vóórdat de
    // speler zijn eigen worp heeft gezien (alleen op TV zichtbaar).
    const user = userEvent.setup()
    const bob = fixtureState.players[1]
    const defendingState = attackState({ activePlayerId: 'alice', pendingCombat, toTerritoryOwnerId: 'bob' })
    const resolvedState = attackState({ activePlayerId: 'alice', pendingCombat: null, toTerritoryOwnerId: 'bob' })
    const chooseDefenseDice = vi.fn().mockResolvedValue({
      attackerRolls: [4],
      defenderRolls: [6],
      attackerLosses: 1,
      defenderLosses: 0,
      conquered: false,
      state: resolvedState,
    })
    const combatAfterChoice: CombatBroadcastState = { correlationId: 'combat-1', attackerRolls: [4], defenderRolls: [6], narrated: null }

    const { rerender } = render(
      <PhoneAttackScreen {...fixtureProps({ state: defendingState, playerId: 'bob', me: bob, chooseDefenseDice, combat: null })} />,
    )

    expect(screen.getByText('Je wordt aangevallen')).toBeInTheDocument()

    await user.click(screen.getByText('2'))

    expect(chooseDefenseDice).toHaveBeenCalledWith(2)
    expect(await screen.findByText('Je verslaat 1 leger')).toBeInTheDocument()

    // De ouder (`useGameState` in het echt) past `resolvedState` toe en levert de nieuwe
    // `combat`-broadcast — precies het moment waarop de rol zonder de fix al was omgeslagen.
    rerender(
      <PhoneAttackScreen {...fixtureProps({ state: resolvedState, playerId: 'bob', me: bob, chooseDefenseDice, combat: combatAfterChoice })} />,
    )

    expect(resolveAttackRole(resolvedState, 'bob')).toBe('bystander')
    expect(screen.getByText('Je verslaat 1 leger')).toBeInTheDocument()

    // Een nieuwe aanval van dezelfde aanvaller op hetzelfde gebied (een verse 'defending'-sessie
    // na een tussenliggende bystander-render) moet het oude resultaat automatisch wegklikken en
    // de normale keuze-UI teruggeven.
    const secondCombat: CombatBroadcastState = { correlationId: 'combat-2', attackerRolls: null, defenderRolls: null, narrated: null }
    rerender(
      <PhoneAttackScreen {...fixtureProps({ state: defendingState, playerId: 'bob', me: bob, chooseDefenseDice, combat: secondCombat })} />,
    )

    expect(screen.queryByText('Je verslaat 1 leger')).not.toBeInTheDocument()
    expect(screen.getByText('Verdedig dit gebied.')).toBeInTheDocument()
  })

  it('laat het verdedigingsresultaat los zodra de beurt zonder nieuwe aanval doorschuift naar een andere speler', () => {
    // Zonder deze guard zou een verdediger die nooit op "Terug naar het spel" klikt, bij zijn
    // eigen volgende aanvalsbeurt nog steeds het oude resultaatscherm zien i.p.v. `AttackFlowStep`.
    const bob = fixtureState.players[1]
    const defendingState = attackState({ activePlayerId: 'alice', pendingCombat, toTerritoryOwnerId: 'bob' })
    const resolvedState = attackState({ activePlayerId: 'alice', pendingCombat: null, toTerritoryOwnerId: 'bob' })
    const chooseDefenseDice = vi.fn().mockResolvedValue({
      attackerRolls: [4],
      defenderRolls: [6],
      attackerLosses: 1,
      defenderLosses: 0,
      conquered: false,
      state: resolvedState,
    })

    const { rerender } = render(
      <PhoneAttackScreen {...fixtureProps({ state: defendingState, playerId: 'bob', me: bob, chooseDefenseDice, combat: null })} />,
    )
    rerender(
      <PhoneAttackScreen
        {...fixtureProps({
          state: resolvedState,
          playerId: 'bob',
          me: bob,
          chooseDefenseDice,
          combat: { correlationId: 'combat-1', attackerRolls: [4], defenderRolls: [6], narrated: null },
        })}
      />,
    )

    // Bob's eigen beurt begint (Attack-fase, geen pendingCombat): resolveAttackRole geeft 'attacker'.
    const bobsTurnState = attackState({ activePlayerId: 'bob', pendingCombat: null, toTerritoryOwnerId: null })
    rerender(<PhoneAttackScreen {...fixtureProps({ state: bobsTurnState, playerId: 'bob', me: bob, chooseDefenseDice, combat: null })} />)

    expect(screen.queryByText('Je wordt aangevallen')).not.toBeInTheDocument()
  })
})
