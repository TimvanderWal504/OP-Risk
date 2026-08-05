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
      narrated: null,
    })

    act(() => emit('DiceRolled', diceRolled({ context: 'defense', dice: [3] })))
    act(() => emit('CombatNarrated', narrated()))

    expect(result.current).toEqual({
      correlationId: 'combat-1',
      attackerRolls: [5, 4],
      defenderRolls: [3],
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
      narrated: null,
    })
  })
})
