import { useTranslation } from 'react-i18next'
import type { CombatBroadcastState } from '../../../hooks/useCombatBroadcast'
import { NotYourTurnStep } from '../../../components/NotYourTurnStep'
import { AttackFlowStep } from '../../../components/AttackFlowStep'
import { ConquestMoveStep } from '../../../components/ConquestMoveStep'
import { DefendStep } from '../../../components/DefendStep'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'
import { resolveAttackRole } from './resolveAttackRole'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Aanvallen (`TurnPhaseDto.Attack`, FO §5.3). Vier rollen i.p.v. de turn-based tweedeling van
 * Reinforce/InitialPlacement — zie `resolveAttackRole` en het bouwplan.
 */
export function PhoneAttackScreen({ state, playerId, me, territoryCatalog, combat, declareAttack, chooseDefenseDice, moveAfterConquest, abandonAttack, endPhase }: PhoneScreenProps) {
  const { t } = useTranslation('attack')

  if (!state.turnState) {
    return <PhonePlaceholderScreen />
  }

  const role = resolveAttackRole(state, playerId)
  const myColor = state.colors.find((color) => color.id === me.colorId) ?? null

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

  if (role === 'defending') {
    const pendingCombat = state.turnState.pendingCombat!
    const attacker = state.players.find((player) => player.id === state.turnState!.activePlayerId)
    const attackerColor = state.colors.find((color) => color.id === attacker?.colorId) ?? null
    const defenderArmyCount = state.territories.find((t) => t.territoryId === pendingCombat.toTerritoryId)?.armyCount ?? 1

    return (
      <DefendStep
        attackerName={attacker?.name ?? ''}
        attackerColor={attackerColor}
        myColor={myColor}
        fromTerritoryId={pendingCombat.fromTerritoryId}
        toTerritoryId={pendingCombat.toTerritoryId}
        defenderArmyCount={defenderArmyCount}
        onChooseDefenseDice={chooseDefenseDice}
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

  const activePlayer = state.players.find((player) => player.id === state.turnState!.activePlayerId)
  const activeColor = state.colors.find((color) => color.id === activePlayer?.colorId) ?? null

  return <NotYourTurnStep activePlayerName={activePlayer?.name ?? ''} activeColor={activeColor} subtitle={t('bystander.subtitle')} />
}
