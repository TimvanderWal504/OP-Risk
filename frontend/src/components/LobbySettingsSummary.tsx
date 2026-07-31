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

/**
 * Instellingen-samenvatting op de TV (FO §10; Host-scherm.dc.html L92-103, `settingsRows`
 * L807-815). Rijvolgorde en per-rij accentkleur zijn letterlijk uit de export overgenomen:
 * winconditie in gold-400, "aan"-waarden in pitch-400, overige in fg1.
 *
 * De export toont maar één timer-rij ("Beurttimer") — geen aparte fortify-timer-rij, dus
 * `fortifyTimerSeconds` wordt hier niet getoond (wel elders, in `CreateGameForm`).
 */
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

  const rows: [string, string, string][] = [
    [t('settings.map'), t('settings.mapValue'), 'var(--fg1)'],
    [t('settings.winCondition'), winConditionLabels[settings.winCondition], 'var(--gold-400)'],
    [
      t('settings.roles'),
      settings.rolesEnabled ? roleAssignmentLabels[settings.roleAssignment] : t('settings.off'),
      settings.rolesEnabled ? 'var(--pitch-400)' : 'var(--fg1)',
    ],
    [
      t('settings.eventsRound'),
      settings.eventsEnabled ? t('settings.on') : t('settings.off'),
      settings.eventsEnabled ? 'var(--pitch-400)' : 'var(--fg1)',
    ],
    [t('settings.setupMode'), setupModeLabels[settings.setupMode], 'var(--fg1)'],
    [t('settings.startingArmies'), String(settings.startingArmies), 'var(--fg1)'],
    [t('settings.turnTimer'), formatSeconds(settings.turnTimerSeconds), 'var(--fg1)'],
  ]

  return (
    <div className="flex-none rounded-[22px] border border-[var(--atlas-glass-border)] bg-[var(--atlas-glass)] p-[20px_22px] shadow-[0_24px_60px_rgba(0,0,0,.4)]">
      <p className="mb-2 text-[16px] font-extrabold tracking-[.14em] text-pitch-500 uppercase">
        {t('settings.title')}
      </p>
      <dl className="grid grid-cols-2 gap-x-[26px] gap-y-[2px]">
        {rows.map(([label, value ]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 border-b border-[var(--atlas-glass-border)] py-[9px]"
          >
            <dt className="text-[16px] text-fg-secondary">{label}</dt>
            <dd className="text-right font-display text-[16px] font-extrabold">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
