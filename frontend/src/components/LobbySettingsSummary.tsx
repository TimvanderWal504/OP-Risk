import { useTranslation } from 'react-i18next'
import {
  RoleAssignmentModeDto,
  SetupModeDto,
  WinConditionDto,
  type GameSettingsDto,
} from '../types/GameSettings'
import { tDynamic } from '../i18n/useT'
import { GlassPanel } from './ui/GlassPanel'

export interface LobbySettingsSummaryProps {
  settings: GameSettingsDto
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return rest === 0 ? `${minutes} min` : `${minutes}:${rest.toString().padStart(2, '0')} min`
}

/**
 * Instellingen-samenvatting op de TV (FO §10). Rijvolgorde en per-rij accentkleur: winconditie
 * in silver-400, "aan"-waarden in pitch-400, overige in fg1.
 *
 * Toont geen aparte fortify-timer-rij, alleen "Beurttimer" — `fortifyTimerSeconds` wordt hier
 * niet getoond (wel elders, in `CreateGameForm`).
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
    [t('settings.winCondition'), winConditionLabels[settings.winCondition], 'var(--color-silver-400)'],
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
    [
      t('settings.startingArmies'),
      tDynamic(`startingArmies.preset.${settings.startingArmiesPresetId}.title`, 'createGame'),
      'var(--fg1)',
    ],
    [t('settings.turnTimer'), formatSeconds(settings.turnTimerSeconds), 'var(--fg1)'],
  ]

  return (
    <GlassPanel elevation="base" context="tv" className="flex-none">
      <p className="mb-2 text-[16px] font-extrabold tracking-[.14em] text-pitch-400 uppercase">
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
    </GlassPanel>
  )
}
