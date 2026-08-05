import { useEffect, useState } from 'react'
import type { GameStateDto } from '../types/GameState'
import { GamePhaseDto, TurnPhaseDto } from '../types/GameState'
import type { CombatBroadcastState } from './useCombatBroadcast'

/**
 * TV-only: hoe lang de combat-overlay nog zichtbaar blijft nadat een gevecht volledig is
 * afgehandeld (opgelost én `pendingCombat` leeg) vóór hij verdwijnt. Komt **niet** uit
 * `motion.ts` — de export schakelt daar op state (`sc-if`), geen `setTimeout`-waarde om over
 * te nemen. Zelfde soort productbeslissing als `ORDER_ROLL_REVEAL_HOLD_MS` in `useHeldPhase.ts`,
 * hier apart vastgesteld (5s) omdat een gevecht vaker voorkomt dan de eenmalige
 * volgordebepaling en de intro-animaties zelf al ~2,5-3s in beslag nemen
 * (`combatStageIn` .5s + dobbelsteen-entree tot ~1,7s + `resultPop` tot ~1s later).
 * Presentatietiming, geen spelregel — zie de doc-comment op `useHeldPhase` voor de volledige
 * redenering, die hier onverkort geldt.
 */
const COMBAT_REVEAL_HOLD_MS = 5000

/**
 * Houdt de laatste `CombatBroadcastState` nog zichtbaar op de TV nadat de server al
 * doorschuift. Alleen TV-only: de telefoon is overal knop-gedreven (zie het Attack-bouwplan)
 * en heeft dus geen houd-periode nodig — `useGameState` gebruikt `useCombatBroadcast`
 * rechtstreeks.
 *
 * De houd-telling start bewust pas zodra het gevecht **volledig** is afgehandeld
 * (`held.narrated !== null` én `pendingCombat` leeg) — niet zodra `pendingCombat` toevallig
 * leeg lijkt, want bij een verovering blijft `pendingCombat` bewust staan tot
 * `MoveAfterConquest` (zie het bouwplan), en bij de allereerste `attack`-broadcast kán
 * `pendingCombat` in de nog-lopende `GameStateDto`-snapshot zelfs nog niet gezet zijn (de
 * `DiceRolled`-broadcast bij `DeclareAttack` wordt vóór de state-snapshot verstuurd) — op
 * *dat* signaal zou de houd-telling voortijdig kunnen starten.
 */
export function useHeldCombat(
  combat: CombatBroadcastState | null,
  state: GameStateDto | null,
): CombatBroadcastState | null {
  const [held, setHeld] = useState<CombatBroadcastState | null>(combat)

  // Welk gevecht het laatst is weggehaald (door de guard óf door de houd-periode) — voorkomt
  // dat de spiegel-branch hieronder het net geleegde `held` in dezelfde render-cyclus weer
  // terugzet. Zonder dit: "adjusting state during render" laat React de componentfunctie
  // meteen opnieuw uitvoeren ná een setState, en die vervolg-render ziet `combat` nog
  // steeds als dezelfde (nog niet vervangen) referentie die niet gelijk is aan het net op
  // `null` gezette `held` — de spiegel-conditie (`combat !== held`) is dan alsnog waar en
  // adopteert het weggehaalde gevecht meteen weer. Zichtbaar netto-effect: de overlay
  // verandert nooit, wat exact het gerapporteerde gedrag was (bevinding 2026-08-04).
  const [dismissedCorrelationId, setDismissedCorrelationId] = useState<string | null>(null)

  const pendingCombat = state?.turnState?.pendingCombat ?? null
  const turnPhase = state?.turnState?.turnPhase
  const activePlayerId = state?.turnState?.activePlayerId ?? null
  const isInProgress = state?.phase === GamePhaseDto.InProgress

  // Bijgehouden om een beurtwissel te herkennen die de client nooit als een aparte
  // `turnPhase !== Attack`-render ziet: als de server bv. Verplaatsen(A) én Versterken(B)
  // allebei zonder geldige zetten overslaat vóórdat er een broadcast uitgaat, springt de
  // state in één keer van "Attack, A actief" naar "Attack, B actief" — `turnPhase` blijft dan
  // de hele tijd `Attack`, dus die check alleen mist deze beurtwissel. `activePlayerId`
  // wisselt in dat geval wél altijd, dus is de robuustere kanarie.
  const [heldForActivePlayerId, setHeldForActivePlayerId] = useState(activePlayerId)
  const activePlayerChanged = activePlayerId !== heldForActivePlayerId

  if (activePlayerChanged) {
    setHeldForActivePlayerId(activePlayerId)
  }

  const leftAttackWithinInProgress = isInProgress && (turnPhase !== TurnPhaseDto.Attack || activePlayerChanged)

  // Beide aanpassingen gebeuren tijdens render (niet in een effect — react-hooks/set-state-in-effect
  // zou een synchrone setState in een effect toch als extra cascaderende render zien, terwijl dit
  // gewoon afgeleide state is die "meteen klopt" moet zijn, net als `useHeldPhase.ts`).
  //
  // Gesplitste guard (zie bouwplan): alleen synchroon leegmaken op een turnPhase-wissel binnen
  // InProgress (EndPhase naar Fortify, een nieuwe actieve speler, of een nieuwe beurt) — niet
  // bij de overgang naar Finished, want juist een winnende eliminatie hoort de houd-periode
  // gewoon af te laten lopen.
  if (leftAttackWithinInProgress && held !== null) {
    setHeld(null)
    setDismissedCorrelationId(held.correlationId)
  } else if (
    // Spiegelt `combat` zodra er een nieuwer/verder gevuld object is — nieuwe correlationId of
    // extra data (attackerRolls/defenderRolls/narrated) op hetzelfde gevecht. Niet spiegelen
    // zodra `turnPhase` Attack al verlaten heeft (binnen InProgress), en niet het gevecht dat
    // net is weggehaald (zie `dismissedCorrelationId` hierboven) — pas een écht nieuwe
    // `correlationId` mag opnieuw geadopteerd worden.
    combat !== null &&
    combat !== held &&
    combat.correlationId !== dismissedCorrelationId &&
    !leftAttackWithinInProgress
  ) {
    setHeld(combat)
  }

  useEffect(() => {
    if (held?.narrated == null) return
    if (pendingCombat !== null) return
    if (leftAttackWithinInProgress) return

    const timeout = setTimeout(() => {
      setHeld(null)
      setDismissedCorrelationId(held.correlationId)
    }, COMBAT_REVEAL_HOLD_MS)

    return () => clearTimeout(timeout)
  }, [held, pendingCombat, leftAttackWithinInProgress])

  return held
}
