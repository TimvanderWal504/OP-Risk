import { ClaimTerritoryStep } from '../../../components/ClaimTerritoryStep'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * Startopstelling · Claimen (FO §5.1). `setupState` hoort in deze fase altijd gevuld te zijn;
 * is dat niet zo, dan mist de client informatie die de server had moeten sturen en valt het
 * scherm terug op de placeholder in plaats van te crashen.
 */
export function PhoneClaimingScreen({
  state,
  playerId,
  error,
  territoryCatalog,
  claimTerritory,
}: PhoneScreenProps) {
  if (!state.setupState?.activePlayerId) {
    return <PhonePlaceholderScreen />
  }

  return (
    <ClaimTerritoryStep
      territories={state.territories}
      territoryCatalog={territoryCatalog}
      players={state.players}
      colors={state.colors}
      activePlayerId={state.setupState.activePlayerId}
      playerId={playerId}
      claimableTerritoryIds={state.setupState.claimableTerritoryIdsByPlayer[playerId] ?? []}
      onClaim={claimTerritory}
      error={error}
    />
  )
}
