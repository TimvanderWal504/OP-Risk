import { useState } from 'react'
import type { CombatBroadcastState } from './useCombatBroadcast'

/**
 * Het gevecht van de lopende beurt op de telefoon — `null` zodra de beurt is doorgeschoven.
 *
 * `useCombatBroadcast` onthoudt het laatste gevecht tot er een nieuw binnenkomt, ook over
 * beurtgrenzen heen. `AttackFlowStep` start op het gevechtsscherm als dat gevecht van deze
 * speler was en niet in een verovering eindigde (bedoeld voor een remount vlak na een aanval).
 * Zonder deze grens liet een aanval van een vorige ronde de telefoon bij de volgende eigen
 * Aanvallen-fase meteen weer op dat oude gevecht openen, alsof er een aanval gestart was.
 *
 * Een beurtwissel herkent deze hook aan een andere actieve speler (zelfde kanarie als
 * `useHeldCombat`). Het gevecht dat op dat moment bekend was, telt daarna niet meer; een nieuw
 * gevecht heeft een andere `correlationId` en komt gewoon door.
 */
export function useTurnCombat(combat: CombatBroadcastState | null, activePlayerId: string | null): CombatBroadcastState | null {
  const [seenActivePlayerId, setSeenActivePlayerId] = useState(activePlayerId)
  const [staleCorrelationId, setStaleCorrelationId] = useState<string | null>(null)

  let stale = staleCorrelationId
  if (activePlayerId !== seenActivePlayerId) {
    stale = combat?.correlationId ?? null
    setSeenActivePlayerId(activePlayerId)
    setStaleCorrelationId(stale)
  }

  return combat !== null && combat.correlationId !== stale ? combat : null
}
