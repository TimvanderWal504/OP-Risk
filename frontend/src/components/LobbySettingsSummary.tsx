import { useTranslation } from 'react-i18next'
import {
  RoleAssignmentModeDto,
  SetupModeDto,
  WinConditionDto,
  type GameSettingsDto,
} from '../types/GameSettings'

export interface LobbySettingsSummaryProps {
  settings: GameSettingsDto
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return rest === 0 ? `${minutes} min` : `${minutes}:${rest.toString().padStart(2, '0')} min`
}

/** Instellingen-samenvatting op de TV (FO §10). */
export function LobbySettingsSummary({ settings }: LobbySettingsSummaryProps) {
  const { t } = useTranslation('lobby')

  const winConditionLabels: Record<WinConditionDto, string> = {
    [WinConditionDto.WorldDomination]: t('winCondition.worldDomination'),
    [WinConditionDto.SecretMissions]: t('winCondition.secretMissions'),
  }

  const setupModeLabels: Record<SetupModeDto, string> = {
    [SetupModeDto.Random]: t('setupMode.random'),
    [SetupModeDto.Claiming]: t('setupMode.claiming'),
  }

  const roleAssignmentLabels: Record<RoleAssignmentModeDto, string> = {
    [RoleAssignmentModeDto.Random]: t('roleAssignment.random'),
    [RoleAssignmentModeDto.Choose]: t('roleAssignment.choose'),
  }

  const rows: [string, string][] = [
    [t('settings.winCondition'), winConditionLabels[settings.winCondition]],
    [t('settings.setupMode'), setupModeLabels[settings.setupMode]],
    [t('settings.startingArmies'), String(settings.startingArmies)],
    [t('settings.turnTimer'), formatSeconds(settings.turnTimerSeconds)],
    [t('settings.fortifyTimer'), formatSeconds(settings.fortifyTimerSeconds)],
    [
      t('settings.roles'),
      settings.rolesEnabled ? roleAssignmentLabels[settings.roleAssignment] : t('settings.off'),
    ],
    [t('settings.eventsRound'), settings.eventsEnabled ? t('settings.on') : t('settings.off')],
  ]

  return (
    <div>
      <p className="twc-eyebrow mb-4 text-gold-400">{t('settings.title')}</p>
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
