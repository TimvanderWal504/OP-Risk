import {
  RoleAssignmentModeDto,
  SetupModeDto,
  WinConditionDto,
  type GameSettingsDto,
} from '../types/GameSettings'

export interface LobbySettingsSummaryProps {
  settings: GameSettingsDto
}

const winConditionLabels: Record<WinConditionDto, string> = {
  [WinConditionDto.WorldDomination]: 'Werelddominantie',
  [WinConditionDto.SecretMissions]: 'Geheime missies',
}

const setupModeLabels: Record<SetupModeDto, string> = {
  [SetupModeDto.Random]: 'Random',
  [SetupModeDto.Claiming]: 'Claimen',
}

const roleAssignmentLabels: Record<RoleAssignmentModeDto, string> = {
  [RoleAssignmentModeDto.Random]: 'Random',
  [RoleAssignmentModeDto.Choose]: 'Kiezen',
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return rest === 0 ? `${minutes} min` : `${minutes}:${rest.toString().padStart(2, '0')} min`
}

/** Instellingen-samenvatting op de TV (FO §10). */
export function LobbySettingsSummary({ settings }: LobbySettingsSummaryProps) {
  const rows: [string, string][] = [
    ['Winconditie', winConditionLabels[settings.winCondition]],
    ['Startopstelling', setupModeLabels[settings.setupMode]],
    ['Startlegers', String(settings.startingArmies)],
    ['Beurttimer', formatSeconds(settings.turnTimerSeconds)],
    ['Verplaatsen-timer', formatSeconds(settings.fortifyTimerSeconds)],
    ['Rollen', settings.rolesEnabled ? roleAssignmentLabels[settings.roleAssignment] : 'Uit'],
    ['Gebeurtenisronde', settings.eventsEnabled ? 'Aan' : 'Uit'],
  ]

  return (
    <div>
      <p className="twc-eyebrow mb-4 text-gold-400">Instellingen</p>
      <dl className="flex flex-col gap-0">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-border py-3">
            <dt className="text-fg-secondary">{label}</dt>
            <dd className="font-display font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
