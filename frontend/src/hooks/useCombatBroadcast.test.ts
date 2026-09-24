import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { HubConnection } from '@microsoft/signalr'
import { useCombatBroadcast } from './useCombatBroadcast'
import type { CombatNarratedMessage, DiceRolledMessage } from '../types/HubResponses'

function createFakeConnection() {
  const handlers = new Map<string, ((message: never) => void)[]>()

  const connection = {
    on: (event: string, handler: (message: never) => void) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler])
    },
    off: (event: string, handler: (message: never) => void) => {
      handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== handler))
    },
  } as unknown as HubConnection

  const emit = <T,>(event: string, message: T) => {
    for (const handler of handlers.get(event) ?? []) handler(message as never)
  }

  return { connection, emit }
}

const narrated = (overrides: Partial<CombatNarratedMessage> = {}): CombatNarratedMessage => ({
  correlationId: 'combat-1',
  attackerId: 'p1',
  defenderId: 'p2',
  fromTerritoryId: 'a',
  toTerritoryId: 'b',
  attackerLosses: 1,
  defenderLosses: 0,
  conquered: false,
  eliminatedPlayerId: null,
  stateVersion: 5,
  ...overrides,
})

const diceRolled = (overrides: Partial<DiceRolledMessage> = {}): DiceRolledMessage => ({
  playerId: 'p1',
  dice: [6],
  context: 'attack',
  correlationId: 'combat-1',
  previousRolls: null,
  rerolledDieIndex: null,
  newValue: null,
  ...overrides,
})

describe('useCombatBroadcast', () => {
  it('accumuleert attack- en defense-worpen plus narratie onder dezelfde correlationId', () => {
    const { connection, emit } = createFakeConnection()
    const { result } = renderHook(() => useCombatBroadcast(connection))

    act(() => emit('DiceRolled', diceRolled({ context: 'attack', dice: [5, 4] })))
    expect(result.current).toEqual({
      correlationId: 'combat-1',
      attackerRolls: [5, 4],
      defenderRolls: null,
      reroll: null,
      defenseBoostUsed: false,
      narrated: null,
    })

    act(() => emit('DiceRolled', diceRolled({ context: 'defense', dice: [3] })))
    act(() => emit('CombatNarrated', narrated()))

    expect(result.current).toEqual({
      correlationId: 'combat-1',
      attackerRolls: [5, 4],
      defenderRolls: [3],
      reroll: null,
      defenseBoostUsed: false,
      narrated: narrated(),
    })
  })

  it('negeert order-roll-context volledig (lekt niet in activeCombat)', () => {
    const { connection, emit } = createFakeConnection()
    const { result } = renderHook(() => useCombatBroadcast(connection))

    act(() => emit('DiceRolled', diceRolled({ context: 'order-roll', correlationId: null })))

    expect(result.current).toBeNull()
  })

  it('negeert een attack/defense-DiceRolled zonder correlationId', () => {
    const { connection, emit } = createFakeConnection()
    const { result } = renderHook(() => useCombatBroadcast(connection))

    act(() => emit('DiceRolled', diceRolled({ context: 'attack', correlationId: null })))

    expect(result.current).toBeNull()
  })

  it('opent een nieuw object zodra een onbekende correlationId binnenkomt (nieuw gevecht)', () => {
    const { connection, emit } = createFakeConnection()
    const { result } = renderHook(() => useCombatBroadcast(connection))

    act(() => emit('DiceRolled', diceRolled({ correlationId: 'combat-1', dice: [1, 1] })))
    act(() => emit('CombatNarrated', narrated({ correlationId: 'combat-1' })))

    act(() => emit('DiceRolled', diceRolled({ correlationId: 'combat-2', dice: [6, 6] })))

    expect(result.current).toEqual({
      correlationId: 'combat-2',
      attackerRolls: [6, 6],
      defenderRolls: null,
      reroll: null,
      defenseBoostUsed: false,
      narrated: null,
    })
  })

  it('vervangt attackerRolls en vult reroll bij een reroll-DiceRolled (plan-rollen C5)', () => {
    const { connection, emit } = createFakeConnection()
    const { result } = renderHook(() => useCombatBroadcast(connection))

    act(() => emit('DiceRolled', diceRolled({ context: 'attack', dice: [4, 2] })))
    act(() =>
      emit(
        'DiceRolled',
        diceRolled({ context: 'reroll', dice: [6, 4], previousRolls: [4, 2], rerolledDieIndex: 1, newValue: 6 }),
      ),
    )

    expect(result.current).toEqual({
      correlationId: 'combat-1',
      // `dice` bij `reroll` ís de nieuwe worp — geen apart veld nodig om de weergave bij te
      // werken (zie de doc-comment op RiskGame.Api.Hubs.DiceRolledMessage.Dice).
      attackerRolls: [6, 4],
      defenderRolls: null,
      reroll: { previousRolls: [4, 2], rerolledDieIndex: 1, newValue: 6, rolls: [6, 4] },
      defenseBoostUsed: false,
      narrated: null,
    })
  })

  it('vult defenderRolls en zet defenseBoostUsed bij een defenseBoost-DiceRolled (FO §8.1)', () => {
    const { connection, emit } = createFakeConnection()
    const { result } = renderHook(() => useCombatBroadcast(connection))

    act(() => emit('DiceRolled', diceRolled({ context: 'attack', dice: [4] })))
    act(() => emit('DiceRolled', diceRolled({ context: 'defenseBoost', dice: [6, 5] })))

    expect(result.current).toEqual({
      correlationId: 'combat-1',
      attackerRolls: [4],
      defenderRolls: [6, 5],
      reroll: null,
      defenseBoostUsed: true,
      narrated: null,
    })
  })

  it('opent alsnog een object als het eerste binnenkomende event een defense- of narratie-event is (reconnect middenin een gevecht)', () => {
    const { connection, emit } = createFakeConnection()
    const { result } = renderHook(() => useCombatBroadcast(connection))

    act(() => emit('DiceRolled', diceRolled({ context: 'defense', dice: [2], correlationId: 'combat-9' })))

    expect(result.current).toEqual({
      correlationId: 'combat-9',
      attackerRolls: null,
      defenderRolls: [2],
      reroll: null,
      defenseBoostUsed: false,
      narrated: null,
    })
  })
})
