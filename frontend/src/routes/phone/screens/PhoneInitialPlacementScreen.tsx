import { useTranslation } from 'react-i18next'
import { NotYourTurnStep } from '../../../components/NotYourTurnStep'
import { PlaceInitialArmyStep } from '../../../components/PlaceInitialArmyStep'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Startopstelling · Bijplaatsen (FO §5.1). Twee substaten: wachten tot je aan de beurt bent
 * en zelf plaatsen. Of er überhaupt beurten zijn leidt de server af — bij de willekeurige
 * opstelling plaatst iedereen tegelijk en stuurt de server `activePlayerId: null`.
 */
export function PhoneInitialPlacementScreen({
  state,
  playerId,
  me,
  placeInitialArmy,
}: PhoneScreenProps) {
  const { t } = useTranslation('setup')

  if (!state.setupState) {
    return <PhonePlaceholderScreen />
  }

  const { activePlayerId } = state.setupState

  if (activePlayerId !== null && activePlayerId !== playerId) {
    const activePlayer = state.players.find((player) => player.id === activePlayerId)
    const activeColor = state.colors.find((color) => color.id === activePlayer?.colorId) ?? null

    return (
      <NotYourTurnStep
        activePlayerName={activePlayer?.name ?? ''}
        activeColor={activeColor}
        subtitle={t('place.title')}
      />
    )
  }

  const myTerritories = state.territories.filter((territory) => territory.ownerPlayerId === playerId)
  const myColor = state.colors.find((color) => color.id === me.colorId) ?? null
  const armiesLeft = state.setupState.remainingArmiesByPlayer[playerId] ?? 0

  return (
    <PlaceInitialArmyStep
      myTerritories={myTerritories}
      myColor={myColor}
      armiesLeft={armiesLeft}
      onPlace={placeInitialArmy}
    />
  )
}
