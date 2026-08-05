import { useEffect, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import type { CombatNarratedMessage, DiceRolledMessage } from '../types/HubResponses'

/**
 * Accumuleert de narratieve gevechts-broadcasts ("DiceRolled" met context `attack`/`defense`,
 * en "CombatNarrated") tot één object per gevecht, gegroepeerd op `correlationId`. Gedeeld
 * tussen `useGameState` (telefoon) en `useTvGame` (TV) zodat de reset-/contextfilter-regels
 * precies één keer bestaan — zie het Attack-bouwplan (rolmodel-sectie) voor de motivatie.
 *
 * Geen houd-periode hier: dat is TV-specifiek (`useHeldCombat`). De telefoon is overal
 * knop-gedreven (frontend/CLAUDE.md, "server-authoritative"-sectie + de `next`/`backToWait`-
 * knoppen in het design), dus heeft alleen de kale accumulatie nodig.
 */
export interface CombatBroadcastState {
  correlationId: string
  attackerRolls: number[] | null
  defenderRolls: number[] | null
  narrated: CombatNarratedMessage | null
}

export function useCombatBroadcast(connection: HubConnection | undefined): CombatBroadcastState | null {
  const [combat, setCombat] = useState<CombatBroadcastState | null>(null)

  useEffect(() => {
    if (!connection) return

    // Opent een vers object zodra de `correlationId` niet meer overeenkomt met het lopende
    // gevecht — dekt zowel "nieuw gevecht" als "reconnect middenin een gevecht, het eerste
    // binnenkomende event van welke soort dan ook opent alsnog een (deels gevuld) object" in
    // plaats van broadcasts stil te laten vallen omdat er nog niets was om aan te vullen.
    const withCombat = (correlationId: string, apply: (current: CombatBroadcastState) => CombatBroadcastState) => {
      setCombat((current) =>
        apply(
          current && current.correlationId === correlationId
            ? current
            : { correlationId, attackerRolls: null, defenderRolls: null, narrated: null },
        ),
      )
    }

    const onDiceRolled = (message: DiceRolledMessage) => {
      if (message.context !== 'attack' && message.context !== 'defense') return
      if (message.correlationId === null) return

      const correlationId = message.correlationId

      withCombat(correlationId, (current) =>
        message.context === 'attack'
          ? { ...current, attackerRolls: message.dice }
          : { ...current, defenderRolls: message.dice },
      )
    }

    const onCombatNarrated = (message: CombatNarratedMessage) => {
      withCombat(message.correlationId, (current) => ({ ...current, narrated: message }))
    }

    connection.on('DiceRolled', onDiceRolled)
    connection.on('CombatNarrated', onCombatNarrated)

    return () => {
      connection.off('DiceRolled', onDiceRolled)
      connection.off('CombatNarrated', onCombatNarrated)
    }
  }, [connection])

  return combat
}
