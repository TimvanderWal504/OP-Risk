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
/** Details van de laatste rol-herwerp dit gevecht (plan-rollen C5/B2) — alleen gezet zodra de
 *  "reroll"-broadcast binnenkomt, blijft daarna staan voor de rest van het gevecht (de
 *  herwerp-animatie speelt precies één keer en houdt zijn eindstand vast, dezelfde `both`-fill
 *  als de overige dobbelsteen-animaties in motion.ts). */
export interface CombatRerollState {
  previousRolls: number[]
  rerolledDieIndex: number
  newValue: number
  rolls: number[]
}

export interface CombatBroadcastState {
  correlationId: string
  attackerRolls: number[] | null
  defenderRolls: number[] | null
  reroll: CombatRerollState | null
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
            : { correlationId, attackerRolls: null, defenderRolls: null, reroll: null, narrated: null },
        ),
      )
    }

    const onDiceRolled = (message: DiceRolledMessage) => {
      if (message.context !== 'attack' && message.context !== 'defense' && message.context !== 'reroll') return
      if (message.correlationId === null) return

      const correlationId = message.correlationId

      withCombat(correlationId, (current) => {
        if (message.context === 'defense') return { ...current, defenderRolls: message.dice }

        // `attack` én `reroll` dragen allebei de (op dat moment) actuele aanvalsworp in `dice`
        // (C5: bij een herwerp is dat de nieuwe, gesorteerde worp) — reroll vult daarnaast de
        // detailvelden voor de highlight-animatie (TV/telefoon, plan-rollen B2).
        return {
          ...current,
          attackerRolls: message.dice,
          reroll:
            message.context === 'reroll'
              ? { previousRolls: message.previousRolls!, rerolledDieIndex: message.rerolledDieIndex!, newValue: message.newValue!, rolls: message.dice }
              : current.reroll,
        }
      })
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
