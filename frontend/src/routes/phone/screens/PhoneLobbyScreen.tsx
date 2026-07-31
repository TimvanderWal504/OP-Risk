import { useState } from 'react'
import { JoinHostWaitStep } from '../../../components/JoinHostWaitStep'
import { JoinNameColorStep } from '../../../components/JoinNameColorStep'
import { JoinRoleStep } from '../../../components/JoinRoleStep'
import { JoinWaitStep } from '../../../components/JoinWaitStep'
import { RoleAssignmentModeDto } from '../../../types/GameSettings'
import { takenColorIds } from './takenColorIds'
import type { PhoneScreenProps } from './phoneScreens'

/**
 * De lobby op de telefoon (FO §3): kleur kiezen → eventueel rol kiezen → wachten, met een
 * eigen variant voor de host (die het spel kan starten en spelers kan verwijderen).
 * De substaat volgt uit wat de speler al gekozen heeft, niet uit lokale navigatiestate —
 * behalve "terug naar kleur", dat bewust wel lokaal is (zie hieronder).
 */
export function PhoneLobbyScreen({
  state,
  me,
  error,
  chooseColor,
  selectRole,
  startGame,
  removePlayer,
}: PhoneScreenProps) {
  // Terug-navigatie vanaf de rolstap: er is geen RenamePlayer-hub-methode, dus
  // "terug" laat alleen een andere kleur kiezen (naam blijft vast op me.name).
  const [revisitingColor, setRevisitingColor] = useState(false)

  const rolePickingRequired =
    state.settings.rolesEnabled && state.settings.roleAssignment === RoleAssignmentModeDto.Choose
  const stepCount = rolePickingRequired ? 3 : 2
  const myTakenColorIds = takenColorIds(state)

  const handleColorPick = async (colorId: string) => {
    await chooseColor(colorId)
    setRevisitingColor(false)
  }

  if (!me.colorId || (rolePickingRequired && !me.roleId && revisitingColor)) {
    return (
      <JoinNameColorStep
        onSubmit={(_, colorId) => handleColorPick(colorId)}
        colors={state.colors}
        takenColorIds={myTakenColorIds}
        fixedName={me.name}
        stepIndex={0}
        stepCount={stepCount}
        error={error}
      />
    )
  }

  if (rolePickingRequired && !me.roleId) {
    return (
      <JoinRoleStep
        roles={state.roles}
        takenRoleIds={state.players.map((player) => player.roleId).filter((id): id is string => id !== null)}
        onPick={selectRole}
        onBack={() => setRevisitingColor(true)}
        stepIndex={1}
        stepCount={stepCount}
        error={error}
      />
    )
  }

  if (me.isHost) {
    return (
      <JoinHostWaitStep
        players={state.players}
        colors={state.colors}
        maxPlayers={state.colors.length}
        canStart
        onStart={startGame}
        onRemovePlayer={removePlayer}
        error={error}
      />
    )
  }

  return (
    <JoinWaitStep
      me={me}
      color={state.colors.find((color) => color.id === me.colorId) ?? null}
      role={state.roles.find((role) => role.id === me.roleId) ?? null}
      joinedCount={state.players.length}
      stepIndex={stepCount - 1}
      stepCount={stepCount}
    />
  )
}
