import { useTranslation } from 'react-i18next'
import { NotYourTurnStep } from '../../../components/NotYourTurnStep'
import { PlaceReinforcementStep } from '../../../components/PlaceReinforcementStep'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Versterken (`TurnPhaseDto.Reinforce`, FO §5.2). Turn-based: wachten of zelf verdelen,
 * zelfde tweedeling als `PhoneInitialPlacementScreen`. `key={state.stateVersion}` op de
 * plaats-stap reset lokale staging bij elke nieuwe server-push (Reinforce-plan: staging
 * hangt aan `stateVersion`, nooit een eigen consistentiemechaniek ernaast).
 */
export function PhoneReinforceScreen({
  state,
  playerId,
  me,
  territoryCatalog,
  placeReinforcements,
  endPhase,
}: PhoneScreenProps) {
  const { t } = useTranslation('reinforce')

  if (!state.turnState) {
    return <PhonePlaceholderScreen />
  }

  const { activePlayerId, armiesRemaining, reinforcementBreakdown } = state.turnState

  if (activePlayerId !== playerId) {
    const activePlayer = state.players.find((player) => player.id === activePlayerId)
    const activeColor = state.colors.find((color) => color.id === activePlayer?.colorId) ?? null

    return (
      <NotYourTurnStep activePlayerName={activePlayer?.name ?? ''} activeColor={activeColor} subtitle={t('kicker')} />
    )
  }

  const myTerritories = state.territories.filter((territory) => territory.ownerPlayerId === playerId)
  const myColor = state.colors.find((color) => color.id === me.colorId) ?? null

  return (
    <PlaceReinforcementStep
      key={state.stateVersion}
      myTerritories={myTerritories}
      myColor={myColor}
      territoryCatalog={territoryCatalog}
      armiesLeft={armiesRemaining}
      breakdown={reinforcementBreakdown}
      onConfirmPlacements={async (placements) => {
        for (const placement of placements) {
          await placeReinforcements(placement.territoryId, placement.amount)
        }
      }}
      onEndPhase={endPhase}
    />
  )
}
