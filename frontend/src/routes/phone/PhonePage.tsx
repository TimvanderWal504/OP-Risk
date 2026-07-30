import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../../hooks/useGameState'
import { useHeldPhase } from '../../hooks/useHeldPhase'
import { JoinNameColorStep } from '../../components/JoinNameColorStep'
import { JoinRoleStep } from '../../components/JoinRoleStep'
import { JoinWaitStep } from '../../components/JoinWaitStep'
import { JoinHostWaitStep } from '../../components/JoinHostWaitStep'
import { OrderRollWaitStep } from '../../components/OrderRollWaitStep'
import { ClaimTerritoryStep } from '../../components/ClaimTerritoryStep'
import { PlaceInitialArmyStep } from '../../components/PlaceInitialArmyStep'
import { NotYourTurnStep } from '../../components/NotYourTurnStep'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { GamePhaseDto, type GameStateDto } from '../../types/GameState'
import { RoleAssignmentModeDto } from '../../types/GameSettings'

const takenColorIds = (state: GameStateDto) =>
  state.colors.map((c) => c.id).filter((id) => !state.availableColorIds.includes(id))

export function PhonePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { t } = useTranslation('lobby')
  const { t: tSetup } = useTranslation('setup')
  const {
    state,
    playerId,
    error,
    orderRollThrows,
    territoryCatalog,
    joinGameWithColor,
    chooseColor,
    removePlayer,
    selectRole,
    startGame,
    rollForOrder,
    claimTerritory,
    placeInitialArmy,
  } = useGameState(gameId!)
  const displayPhase = useHeldPhase(state?.phase)
  // Terug-navigatie vanaf de rolstap: er is geen RenamePlayer-hub-methode, dus
  // "terug" laat alleen een andere kleur kiezen (naam blijft vast op me.name).
  const [revisitingColor, setRevisitingColor] = useState(false)

  if (!playerId || !state) {
    return (
      <PhoneShell>
        <JoinNameColorStep
          onSubmit={joinGameWithColor}
          colors={state?.colors ?? []}
          takenColorIds={state ? takenColorIds(state) : []}
          stepIndex={0}
          stepCount={3}
          error={error}
        />
      </PhoneShell>
    )
  }

  const me = state.players.find((player) => player.id === playerId)

  if (!me) {
    return (
      <PhoneShell>
        <JoinNameColorStep
          onSubmit={joinGameWithColor}
          colors={state.colors}
          takenColorIds={takenColorIds(state)}
          stepIndex={0}
          stepCount={3}
          error={error}
        />
      </PhoneShell>
    )
  }

  if (displayPhase === GamePhaseDto.OrderRoll) {
    const myColor = state.colors.find((c) => c.id === me.colorId)
    return (
      <PhoneShell>
        <OrderRollWaitStep
          myDice={orderRollThrows[playerId]}
          colorHex={myColor?.hex ?? '#ffffff'}
          colorOnHex={myColor?.onHex ?? '#000000'}
          canRoll={state.orderRollState !== null}
          onRoll={rollForOrder}
          error={error}
        />
      </PhoneShell>
    )
  }

  if (displayPhase === GamePhaseDto.Claiming && state.setupState) {
    return (
      <PhoneShell>
        <ClaimTerritoryStep
          territories={state.territories}
          territoryCatalog={territoryCatalog}
          players={state.players}
          colors={state.colors}
          activePlayerId={state.setupState.activePlayerId}
          playerId={playerId}
          onClaim={claimTerritory}
          error={error}
        />
      </PhoneShell>
    )
  }

  if (displayPhase === GamePhaseDto.InitialPlacement && state.setupState) {
    if (state.setupState.activePlayerId !== playerId) {
      const activePlayer = state.players.find((player) => player.id === state.setupState!.activePlayerId)
      const activeColor = state.colors.find((c) => c.id === activePlayer?.colorId) ?? null

      return (
        <PhoneShell>
          <NotYourTurnStep
            activePlayerName={activePlayer?.name ?? ''}
            activeColor={activeColor}
            subtitle={tSetup('place.title')}
          />
        </PhoneShell>
      )
    }

    const myTerritories = state.territories.filter((territory) => territory.ownerPlayerId === playerId)
    const myColor = state.colors.find((c) => c.id === me.colorId) ?? null
    const armiesLeft = state.settings.startingArmies - myTerritories.reduce((sum, t) => sum + t.armyCount, 0)

    return (
      <PhoneShell>
        <PlaceInitialArmyStep
          myTerritories={myTerritories}
          myColor={myColor}
          armiesLeft={armiesLeft}
          onPlace={placeInitialArmy}
        />
      </PhoneShell>
    )
  }

  if (displayPhase !== GamePhaseDto.Lobby) {
    return (
      <PhoneShell>
        <div className="flex h-full items-center justify-center p-5 text-center text-fg-muted">
          {t('placeholder.phone')}
        </div>
      </PhoneShell>
    )
  }

  const rolePickingRequired =
    state.settings.rolesEnabled && state.settings.roleAssignment === RoleAssignmentModeDto.Choose
  const stepCount = rolePickingRequired ? 3 : 2
  const myTakenColorIds = takenColorIds(state)

  const handleColorPick = async (colorId: string) => {
    await chooseColor(colorId)
    setRevisitingColor(false)
  }

  if (!me.colorId) {
    return (
      <PhoneShell>
        <JoinNameColorStep
          onSubmit={(_, colorId) => handleColorPick(colorId)}
          colors={state.colors}
          takenColorIds={myTakenColorIds}
          fixedName={me.name}
          stepIndex={0}
          stepCount={stepCount}
          error={error}
        />
      </PhoneShell>
    )
  }

  if (rolePickingRequired && !me.roleId) {
    if (revisitingColor) {
      return (
        <PhoneShell>
          <JoinNameColorStep
            onSubmit={(_, colorId) => handleColorPick(colorId)}
            colors={state.colors}
            takenColorIds={myTakenColorIds}
            fixedName={me.name}
            stepIndex={0}
            stepCount={stepCount}
            error={error}
          />
        </PhoneShell>
      )
    }

    return (
      <PhoneShell>
        <JoinRoleStep
          roles={state.roles}
          takenRoleIds={state.players.map((p) => p.roleId).filter((id): id is string => id !== null)}
          onPick={selectRole}
          onBack={() => setRevisitingColor(true)}
          stepIndex={1}
          stepCount={stepCount}
          error={error}
        />
      </PhoneShell>
    )
  }

  if (me.isHost) {
    return (
      <PhoneShell>
        <JoinHostWaitStep
          players={state.players}
          colors={state.colors}
          maxPlayers={state.colors.length}
          canStart
          onStart={startGame}
          onRemovePlayer={removePlayer}
          error={error}
        />
      </PhoneShell>
    )
  }

  const color = state.colors.find((c) => c.id === me.colorId) ?? null
  const role = state.roles.find((r) => r.id === me.roleId) ?? null

  return (
    <PhoneShell>
      <JoinWaitStep
        me={me}
        color={color}
        role={role}
        joinedCount={state.players.length}
        stepIndex={stepCount - 1}
        stepCount={stepCount}
      />
    </PhoneShell>
  )
}
