import { useTranslation } from 'react-i18next'
import { NotYourTurnStep } from '../../../components/NotYourTurnStep'
import { FortifyFlowStep } from '../../../components/FortifyFlowStep'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Verplaatsen (`TurnPhaseDto.Fortify`, FO §5.2). Turn-based tweedeling zoals
 * `PhoneReinforceScreen` — Fortify kent, anders dan Attack, geen aanvaller/verdediger-
 * onderscheid, dus geen 4-rollen-dispatch nodig.
 */
export function PhoneFortifyScreen({ state, playerId, me, error, fortify, endTurn }: PhoneScreenProps) {
  const { t } = useTranslation('fortify')

  if (!state.turnState) {
    return <PhonePlaceholderScreen />
  }

  const { activePlayerId, hasFortified, reachableFortifyGroups } = state.turnState

  if (activePlayerId !== playerId) {
    const activePlayer = state.players.find((player) => player.id === activePlayerId)
    const activeColor = state.colors.find((color) => color.id === activePlayer?.colorId) ?? null

    return (
      <NotYourTurnStep activePlayerName={activePlayer?.name ?? ''} activeColor={activeColor} subtitle={t('bystander.subtitle')} />
    )
  }

  const myTerritories = state.territories.filter((territory) => territory.ownerPlayerId === playerId)
  const myColor = state.colors.find((color) => color.id === me.colorId) ?? null

  return (
    <FortifyFlowStep
      myTerritories={myTerritories}
      myColor={myColor}
      hasFortified={hasFortified}
      reachableGroups={reachableFortifyGroups}
      error={error}
      onFortify={fortify}
      onEndTurn={endTurn}
    />
  )
}
