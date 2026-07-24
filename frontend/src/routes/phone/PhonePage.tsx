import { useParams } from 'react-router-dom'
import { useGameState } from '../../hooks/useGameState'
import { JoinNameStep } from '../../components/JoinNameStep'
import { JoinColorStep } from '../../components/JoinColorStep'
import { JoinRoleStep } from '../../components/JoinRoleStep'
import { JoinWaitStep } from '../../components/JoinWaitStep'
import { OrderRollWaitStep } from '../../components/OrderRollWaitStep'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { GamePhaseDto } from '../../types/GameState'
import { RoleAssignmentModeDto } from '../../types/GameSettings'

export function PhonePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const {
    state,
    playerId,
    error,
    orderRollThrows,
    joinGame,
    chooseColor,
    selectRole,
    startGame,
    rollForOrder,
  } = useGameState(gameId!)

  if (!state || !playerId) {
    return (
      <PhoneShell>
        <JoinNameStep onSubmit={joinGame} error={error} />
      </PhoneShell>
    )
  }

  const me = state.players.find((player) => player.id === playerId)

  if (!me) {
    return (
      <PhoneShell>
        <JoinNameStep onSubmit={joinGame} error={error} />
      </PhoneShell>
    )
  }

  if (state.phase === GamePhaseDto.OrderRoll) {
    return (
      <PhoneShell>
        <OrderRollWaitStep
          myDice={orderRollThrows[playerId]}
          canRoll={state.orderRollState !== null}
          onRoll={rollForOrder}
          error={error}
        />
      </PhoneShell>
    )
  }

  if (state.phase !== GamePhaseDto.Lobby) {
    return (
      <PhoneShell>
        <div className="flex h-full items-center justify-center p-5 text-center text-fg-muted">
          Spel is gestart — het spelbord volgt in een latere bouwplak.
        </div>
      </PhoneShell>
    )
  }

  if (!me.colorId) {
    return (
      <PhoneShell>
        <JoinColorStep
          colors={state.colors}
          takenColorIds={state.colors
            .map((c) => c.id)
            .filter((id) => !state.availableColorIds.includes(id))}
          selectedColorId={null}
          onPick={chooseColor}
          error={error}
        />
      </PhoneShell>
    )
  }

  const rolePickingRequired =
    state.settings.rolesEnabled && state.settings.roleAssignment === RoleAssignmentModeDto.Choose

  if (rolePickingRequired && !me.roleId) {
    return (
      <PhoneShell>
        <JoinRoleStep
          roles={state.roles}
          takenRoleIds={state.players.map((p) => p.roleId).filter((id): id is string => id !== null)}
          selectedRoleId={null}
          onPick={selectRole}
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
        gameId={state.gameId}
        me={me}
        color={color}
        role={role}
        joinedCount={state.players.length}
        isHost={me.isHost}
        canStart
        onStart={startGame}
        error={error}
      />
    </PhoneShell>
  )
}
