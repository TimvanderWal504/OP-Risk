import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CombatBroadcastState } from '../../../hooks/useCombatBroadcast'
import type { PlayerColorDto } from '../../../types/GameState'
import { NotYourTurnStep } from '../../../components/NotYourTurnStep'
import { AttackFlowStep } from '../../../components/AttackFlowStep'
import { ConquestMoveStep } from '../../../components/ConquestMoveStep'
import { DefendStep } from '../../../components/DefendStep'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'
import { resolveAttackRole } from './resolveAttackRole'
import type { PhoneScreenProps } from './phoneScreens'

/** Vastgehouden verdedigingscontext — zie de `heldDefend`-doc-comment hieronder. */
interface HeldDefend {
  /** Telt op bij elke nieuwe verdedigingssessie (zie `sessionCounter`) — bewust geen
   *  `combat.correlationId`: die kan halverwege een lopende, nog niet afgeronde sessie alsnog
   *  binnenkomen (de `DiceRolled(attack)`-broadcast hoeft niet gelijk te lopen met de
   *  `pendingCombat`-snapshot) en zou dan `DefendStep` midden in de keuze laten remounten —
   *  precies de bevinding "niks gebeurt na mijn keuze". */
  sessionId: number
  /** Wie er actief was toen dit gevecht speelde — herkent een beurtwissel die dit resultaat
   *  stiekem stilzet (zie de guard verderop). */
  activePlayerId: string
  attackerName: string
  attackerColor: PlayerColorDto | null
  fromTerritoryId: string
  toTerritoryId: string
  defenderArmyCount: number
}

/**
 * Aanvallen (`TurnPhaseDto.Attack`, FO §5.3). Vier rollen i.p.v. de turn-based tweedeling van
 * Reinforce/InitialPlacement — zie `resolveAttackRole` en het bouwplan.
 */
export function PhoneAttackScreen({ state, playerId, me, territoryCatalog, combat, declareAttack, chooseDefenseDice, moveAfterConquest, abandonAttack, endPhase }: PhoneScreenProps) {
  const { t } = useTranslation('attack')

  // Zodra `ChooseDefenseDice` resolvet, kantelt `resolveAttackRole` in dezelfde renderslag al
  // naar 'bystander': de server maakt `pendingCombat` leeg (of wisselt de eigendom bij
  // verovering) in precies dezelfde snapshot als het gevechtsresultaat (zie resolveAttackRole.ts
  // en de doc-comment op `DefendStep`). Zonder dit zou de verdediger zijn eigen worp dus nooit
  // zien — exact de bevinding die dit oplost (worp was alleen op TV zichtbaar). `heldDefend`
  // houdt de context van dat gevecht vast zodat `DefendStep` gemount kan blijven voorbij die
  // rolwissel, tot de speler zelf wegklikt (`onDismiss`), tot een echt nieuwe aanval 'm vervangt
  // (`sessionId` verandert dan, zie `HeldDefend`) — of tot de beurt zonder nieuwe aanval op mij
  // doorschuift naar een andere actieve speler (`activePlayerId`-guard verderop, anders blijft
  // dit scherm voor altijd hangen tot deze speler zelf weer verdedigt).
  const [heldDefend, setHeldDefend] = useState<HeldDefend | null>(null)
  // Herkent de overgang "niet aan het verdedigen" → "aan het verdedigen" als het moment voor een
  // verse sessie — zie `sessionCounter` hieronder voor waarom dit niet op `combat.correlationId`
  // leunt.
  const [wasDefending, setWasDefending] = useState(false)
  const [sessionCounter, setSessionCounter] = useState(0)

  if (!state.turnState) {
    return <PhonePlaceholderScreen />
  }

  const role = resolveAttackRole(state, playerId)
  const myColor = state.colors.find((color) => color.id === me.colorId) ?? null
  const activePlayerId = state.turnState.activePlayerId
  const isDefendingNow = role === 'defending'

  // Rechtstreeks uit de levende `state` afgeleid zolang de rol 'defending' is — nooit uit
  // `heldDefend` zelf, want `setState` hieronder muteert die lokale binding niet binnen dezelfde
  // renderslag (React herrendert pas ná deze functie-aanroep). `defendToShow` is daarom altijd
  // met een geldige waarde gevuld zolang we 'm gebruiken, ook in die tussenliggende slag.
  const livePendingCombat = isDefendingNow ? state.turnState.pendingCombat! : null

  // Nieuwe sessie: alleen bij de overgang in 'defending', niet bij elke render die toevallig nog
  // 'defending' is (dat zou tijdens een lopende, nog niet afgeronde keuze al vuren zodra de
  // `attack`-broadcast alsnog binnendruppelt en `DefendStep` onnodig laten remounten). Lokaal
  // berekend i.p.v. `sessionCounter` terug te lezen: `setSessionCounter` muteert die binding niet
  // binnen dezelfde renderslag (zelfde reden als `defendToShow` hieronder niet uit `heldDefend`
  // zelf leest).
  const isNewSession = isDefendingNow && !wasDefending
  const currentSessionId = isNewSession ? sessionCounter + 1 : sessionCounter

  if (isNewSession) {
    setSessionCounter(currentSessionId)
  }
  if (isDefendingNow !== wasDefending) {
    setWasDefending(isDefendingNow)
  }

  const liveDefend: HeldDefend | null = livePendingCombat && {
    sessionId: currentSessionId,
    activePlayerId,
    attackerName: state.players.find((player) => player.id === activePlayerId)?.name ?? '',
    attackerColor: state.colors.find((color) => color.id === state.players.find((player) => player.id === activePlayerId)?.colorId) ?? null,
    fromTerritoryId: livePendingCombat.fromTerritoryId,
    toTerritoryId: livePendingCombat.toTerritoryId,
    defenderArmyCount: state.territories.find((t) => t.territoryId === livePendingCombat.toTerritoryId)?.armyCount ?? 1,
  }

  // Aanpassen tijdens render (niet in een effect, zelfde adjusting-state-patroon als
  // `useHeldCombat`/`TvCombatOverlay`): dit is pure persistentie voor ná deze renderslag (het
  // moment waarop `livePendingCombat` verdwijnt) — de output hierboven hangt er niet van af.
  if (liveDefend !== null && (heldDefend === null || heldDefend.sessionId !== liveDefend.sessionId)) {
    setHeldDefend(liveDefend)
  } else if (liveDefend === null && heldDefend !== null && heldDefend.activePlayerId !== activePlayerId) {
    // De beurt is intussen doorgeschoven naar een andere actieve speler zonder dat er een nieuwe
    // aanval op mij is gestart — dit resultaat hoort niet meer bij "nu" (zelfde
    // beurtwissel-kanarie als `useHeldCombat.ts`). Nodig zodra deze speler later zelf weer aan de
    // beurt komt: anders zou dit vastgehouden scherm het winnen van zijn eigen `AttackFlowStep`.
    setHeldDefend(null)
  }

  const defendToShow = liveDefend ?? heldDefend

  if (role === 'conquest-move') {
    const pendingCombat = state.turnState.pendingCombat!
    const fromArmyCount = state.territories.find((t) => t.territoryId === pendingCombat.fromTerritoryId)?.armyCount ?? 0

    return (
      <ConquestMoveStep
        fromTerritoryId={pendingCombat.fromTerritoryId}
        toTerritoryId={pendingCombat.toTerritoryId}
        myColor={myColor}
        minArmies={pendingCombat.attackDice}
        maxArmies={Math.max(pendingCombat.attackDice, fromArmyCount - 1)}
        onConfirm={moveAfterConquest}
      />
    )
  }

  if (defendToShow !== null) {
    return (
      <DefendStep
        key={defendToShow.sessionId}
        attackerName={defendToShow.attackerName}
        attackerColor={defendToShow.attackerColor}
        myColor={myColor}
        fromTerritoryId={defendToShow.fromTerritoryId}
        toTerritoryId={defendToShow.toTerritoryId}
        defenderArmyCount={defendToShow.defenderArmyCount}
        onChooseDefenseDice={chooseDefenseDice}
        onDismiss={() => setHeldDefend(null)}
      />
    )
  }

  if (role === 'attacker') {
    const myTerritories = state.territories.filter((territory) => territory.ownerPlayerId === playerId)

    return (
      <AttackFlowStep
        playerId={playerId}
        myTerritories={myTerritories}
        territories={state.territories}
        territoryCatalog={territoryCatalog}
        players={state.players}
        colors={state.colors}
        myColor={myColor}
        pendingCombat={state.turnState.pendingCombat}
        combat={combat as CombatBroadcastState | null}
        onDeclareAttack={declareAttack}
        onAbandonAttack={abandonAttack}
        onEndPhase={endPhase}
      />
    )
  }

  const activePlayer = state.players.find((player) => player.id === activePlayerId)
  const activeColor = state.colors.find((color) => color.id === activePlayer?.colorId) ?? null

  return <NotYourTurnStep activePlayerName={activePlayer?.name ?? ''} activeColor={activeColor} subtitle={t('bystander.subtitle')} />
}
