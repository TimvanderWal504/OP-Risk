import { AttritionWaitStep } from '../../../components/AttritionWaitStep'
import { RemoveArmiesStep } from '../../../components/RemoveArmiesStep'
import { RecentActionKindDto } from '../../../types/GameState'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * "Legers verwijderen" tussen twee beurten (FO §9.2): wie nog moet kiezen, kiest; de rest wacht.
 * Container — leidt de props af uit de server-state (wie wacht, wat deze speler al afstond) en
 * rekent zelf niets uit.
 */
export function PhoneAttritionScreen({ state, playerId, me, territoryCatalog, removeArmies }: PhoneScreenProps) {
  const pending = state.pendingAttrition
  if (!pending) return null

  if (pending.awaitingPlayerIds.includes(playerId)) {
    return (
      <RemoveArmiesStep
        // Niet `stateVersion` (zoals Versterken): hier kiezen spelers tegelijk, dus elke keuze van
        // een ander zou deze onbevestigde keuze wissen. De eigen legers veranderen alleen door een
        // nieuwe kaart.
        key={pending.eventId}
        eventId={pending.eventId}
        amount={pending.amount}
        myTerritories={state.territories.filter((territory) => territory.ownerPlayerId === playerId)}
        myColor={state.colors.find((color) => color.id === me.colorId) ?? null}
        territoryCatalog={territoryCatalog}
        onConfirm={removeArmies}
      />
    )
  }

  // Een kiezer die al koos, stond precies het gevraagde af; wie automatisch afstond, staat in het
  // verloop (0 = niets te missen).
  const removedCount = pending.chooserPlayerIds.includes(playerId)
    ? pending.amount
    : (state.recentActions.find(
        (action) =>
          action.kind === RecentActionKindDto.ArmiesRemoved && action.playerId === playerId && action.eventId === pending.eventId,
      )?.amount ?? null)

  const waitingForNames = state.turnOrder
    .filter((id) => pending.awaitingPlayerIds.includes(id))
    .map((id) => state.players.find((player) => player.id === id)?.name ?? '')

  return <AttritionWaitStep eventId={pending.eventId} removedCount={removedCount} waitingForNames={waitingForNames} />
}
