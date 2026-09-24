import { useTranslation } from 'react-i18next'
import { RoleAssignmentModeDto } from '../types/GameSettings'
import type { GameStateDto, RoleSummaryDto } from '../types/GameState'
import type { PlayerDto } from '../types/Player'
import { PanelSection } from './ui/PanelSection'
import { Badge } from './ui/Badge'
import { tDynamic } from '../i18n/useT'

export interface GameInfoRolesProps {
  state: GameStateDto
  me: PlayerDto
}

/**
 * Tabblad "Rollen" van spelinfo — alleen gemount als rollen aan staan. Rollen zijn openbaar
 * (FO §8): per rol naam, effect in gewone taal (`locales/roles.ts`), herkomstland, wie 'm heeft en
 * of de boost actief is. Of een rol actief is, komt van de server (`PlayerDto.isRoleActive`), nooit
 * zelf afgeleid. Toon van de badge zoals op de TV (DESIGN.md § Role Badge).
 */
export function GameInfoRoles({ state, me }: GameInfoRolesProps) {
  const { t } = useTranslation(['gameInfo', 'common'])
  const holderOf = (roleId: string) => state.players.find((player) => player.roleId === roleId)
  const myRole = state.roles.find((role) => role.id === me.roleId)
  const otherRoles = state.roles.filter((role) => role.id !== me.roleId)

  const renderRole = (role: RoleSummaryDto) => {
    const holder = holderOf(role.id)

    return (
      <div key={role.id} className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-h3 font-extrabold text-fg">{tDynamic(`${role.id}.name`, 'roles')}</span>
          {holder && (
            <Badge tone={holder.isRoleActive ? 'pitch-solid' : 'silver-outline'}>
              {t(holder.isRoleActive ? 'common:playerHeader.roleActive' : 'common:playerHeader.roleInactive')}
            </Badge>
          )}
        </div>
        <p className="font-body text-sm text-fg-secondary">{tDynamic(`${role.id}.description`, 'roles')}</p>
        <p className="font-body text-xs text-fg-muted">
          {t('roles.origin', { territory: tDynamic(role.originTerritory, 'territories') })} ·{' '}
          {holder ? t('roles.heldBy', { name: holder.name }) : t('roles.unassigned')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-sm text-fg-secondary">
        {t(
          state.settings.roleAssignment === RoleAssignmentModeDto.Choose
            ? 'roles.assignment.choose'
            : 'roles.assignment.random',
        )}
      </p>
      {myRole && <PanelSection label={t('roles.yours')}>{renderRole(myRole)}</PanelSection>}
      <PanelSection label={t(myRole ? 'roles.others' : 'tabs.roles')}>{otherRoles.map(renderRole)}</PanelSection>
    </div>
  )
}
