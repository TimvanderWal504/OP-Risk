import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../../hooks/useGameState'
import { JoinNameStep } from '../../components/JoinNameStep'
import { JoinColorStep } from '../../components/JoinColorStep'
import { JoinRoleStep } from '../../components/JoinRoleStep'
import { JoinWaitStep } from '../../components/JoinWaitStep'
import { JoinHostWaitStep } from '../../components/JoinHostWaitStep'
import { OrderRollWaitStep } from '../../components/OrderRollWaitStep'
import { PhoneShell } from '../../components/ui/PhoneShell'
import { GamePhaseDto } from '../../types/GameState'
import { RoleAssignmentModeDto } from '../../types/GameSettings'

export function PhonePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { t } = useTranslation('lobby')
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
        <JoinNameStep onSubmit={joinGame} stepIndex={0} stepCount={3} error={error} />
      </PhoneShell>
    )
  }

  const me = state.players.find((player) => player.id === playerId)

  if (!me) {
    return (
      <PhoneShell>
        <JoinNameStep onSubmit={joinGame} stepIndex={0} stepCount={3} error={error} />
      </PhoneShell>
    )
  }

  if (state.phase === GamePhaseDto.OrderRoll) {
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

  if (state.phase !== GamePhaseDto.Lobby) {
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
  const stepCount = rolePickingRequired ? 4 : 3

  if (!me.colorId) {
    return (
      <PhoneShell>
        <JoinColorStep
          colors={state.colors}
          takenColorIds={state.colors
            .map((c) => c.id)
            .filter((id) => !state.availableColorIds.includes(id))}
          onPick={chooseColor}
          stepIndex={1}
          stepCount={stepCount}
          error={error}
        />
      </PhoneShell>
    )
  }

  if (rolePickingRequired && !me.roleId) {
    return (
      <PhoneShell>
        <JoinRoleStep
          roles={state.roles}
          takenRoleIds={state.players.map((p) => p.roleId).filter((id): id is string => id !== null)}
          onPick={selectRole}
          stepIndex={2}
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
