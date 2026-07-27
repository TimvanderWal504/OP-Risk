import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RoleAssignmentModeDto,
  SetupModeDto,
  WinConditionDto,
  type CreateGameResponse,
  type GameSettingsDto,
} from '../types/GameSettings'
import { ToggleRow } from './ui/ToggleRow'
import { Switch } from './ui/Switch'
import { Stepper } from './ui/Stepper'
import { SegmentedControl } from './ui/SegmentedControl'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import type { ValidationError } from '../types/ValidationError'
import { translateValidationErrors } from '../i18n/hubError'

/** FO §10-standaardwaarden. Startlegers blijft een vrij invulbaar getal — de
 * "klassieke tabel per spelersaantal" staat niet in data/*.json en het spelersaantal
 * is nog onbekend op het moment dat de host dit scherm invult (vóór de lobby).
 * Roltoewijzing en verplaatsen-timer hebben geen bediening in het design (Instellingen-
 * scherm) en blijven daarom op hun default staan — geen invulruimte, zie CLAUDE.md. */
const DEFAULT_SETTINGS: GameSettingsDto = {
  winCondition: WinConditionDto.SecretMissions,
  setupMode: SetupModeDto.Random,
  startingArmies: 20,
  turnTimerSeconds: 180,
  fortifyTimerSeconds: 60,
  rolesEnabled: true,
  roleAssignment: RoleAssignmentModeDto.Random,
  eventsEnabled: true,
}

const MIN_ARMIES = 10
const MAX_ARMIES = 40
const MIN_TIMER_SECONDS = 30
const MAX_TIMER_SECONDS = 600
const TIMER_STEP_SECONDS = 15

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export interface CreateGameFormProps {
  mapId: string
  onCreated: (gameId: string) => void
}

export function CreateGameForm({ mapId, onCreated }: CreateGameFormProps) {
  const { t } = useTranslation('createGame')
  const [settings, setSettings] = useState<GameSettingsDto>(DEFAULT_SETTINGS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId, settings }),
      })

      if (!response.ok) {
        const errors = (await response.json().catch(() => null)) as ValidationError[] | null
        setError(errors && errors.length > 0 ? translateValidationErrors(errors) : t('errors.createFailed'))

        return
      }

      const body = (await response.json()) as CreateGameResponse
      onCreated(body.gameId)
    } catch {
      setError(t('errors.connection'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col text-fg">
      <div className="flex-none px-4.5 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="font-body text-[11px] font-extrabold tracking-[.14em] text-gold-400 uppercase">
            {t('header.kicker')}
          </span>
          <span className="rounded-md bg-gold-400 px-2 py-0.5 text-[10px] font-extrabold tracking-[.08em] text-[#0a0e17]">
            {t('header.hostBadge')}
          </span>
        </div>
        <div className="mt-1 font-display text-[26px] font-black">{t('header.title')}</div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4.5 pt-0.5 pb-3.5">
        <div>
          <div className="mx-0.5 mb-2 font-body text-[11px] font-extrabold tracking-[.12em] text-fg-muted uppercase">
            {t('section.rules')}
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="rounded-card border-2 border-pitch-500 bg-pitch-500/12 px-3.5 py-3">
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-extrabold">{t('map.title')}</div>
                  <div className="text-[11.5px] text-fg-muted">{t('map.description')}</div>
                </div>
                <span className="flex h-6.5 w-6.5 flex-none items-center justify-center rounded-full border-2 border-pitch-500">
                  <span className="h-3.5 w-3.5 rounded-full bg-pitch-400" />
                </span>
              </div>
              <div className="mt-2.5">
                <span className="block font-display text-base font-extrabold">
                  {t('map.standardName')}
                </span>
                <span className="mt-0.5 block font-mono text-xs text-pitch-300">
                  {t('map.standardStats')}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-fg-muted">
                  {t('map.standardDescription')}
                </span>
              </div>
            </div>

            <div className="rounded-card border border-border bg-[var(--atlas-t03)] px-3.5 py-1.5">
              <div className="px-0 py-2 text-xs text-fg-muted">{t('winCondition.sectionHint')}</div>
              <div className="flex items-center gap-3 border-t border-border py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-extrabold">
                    {t('winCondition.worldDomination.title')}
                  </div>
                  <div className="text-[11.5px] text-fg-muted">
                    {t('winCondition.worldDomination.description')}
                  </div>
                </div>
                <Switch
                  label={t('winCondition.worldDomination.title')}
                  on={settings.winCondition === WinConditionDto.WorldDomination}
                  onToggle={() =>
                    setSettings((s) => ({ ...s, winCondition: WinConditionDto.WorldDomination }))
                  }
                />
              </div>
              <div className="flex items-center gap-3 border-t border-border py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-extrabold">
                    {t('winCondition.secretMissions.title')}
                  </div>
                  <div className="text-[11.5px] text-fg-muted">
                    {t('winCondition.secretMissions.description')}
                  </div>
                </div>
                <Switch
                  label={t('winCondition.secretMissions.title')}
                  on={settings.winCondition === WinConditionDto.SecretMissions}
                  onToggle={() =>
                    setSettings((s) => ({ ...s, winCondition: WinConditionDto.SecretMissions }))
                  }
                />
              </div>
            </div>

            <div className="rounded-card border border-border bg-[var(--atlas-t03)] px-3.5 py-3">
              <div className="mb-0.5 font-display text-base font-extrabold">{t('setupMode.title')}</div>
              <div className="mb-2.5 text-[11.5px] text-fg-muted">{t('setupMode.description')}</div>
              <SegmentedControl
                value={settings.setupMode}
                onChange={(setupMode) => setSettings((s) => ({ ...s, setupMode }))}
                options={[
                  { value: SetupModeDto.Random, label: t('setupMode.random') },
                  { value: SetupModeDto.Claiming, label: t('setupMode.claiming') },
                ]}
              />
            </div>

            <Stepper
              label={t('startingArmies.label')}
              sub={t('startingArmies.sub')}
              value={String(settings.startingArmies)}
              valueFontSize={24}
              valueMinWidth={34}
              canDecrement={settings.startingArmies > MIN_ARMIES}
              canIncrement={settings.startingArmies < MAX_ARMIES}
              onDecrement={() =>
                setSettings((s) => ({
                  ...s,
                  startingArmies: Math.max(MIN_ARMIES, s.startingArmies - 1),
                }))
              }
              onIncrement={() =>
                setSettings((s) => ({
                  ...s,
                  startingArmies: Math.min(MAX_ARMIES, s.startingArmies + 1),
                }))
              }
            />

            <Stepper
              label={t('turnTimer.label')}
              sub={t('turnTimer.sub')}
              value={formatTimer(settings.turnTimerSeconds)}
              canDecrement={settings.turnTimerSeconds > MIN_TIMER_SECONDS}
              canIncrement={settings.turnTimerSeconds < MAX_TIMER_SECONDS}
              onDecrement={() =>
                setSettings((s) => ({
                  ...s,
                  turnTimerSeconds: Math.max(MIN_TIMER_SECONDS, s.turnTimerSeconds - TIMER_STEP_SECONDS),
                }))
              }
              onIncrement={() =>
                setSettings((s) => ({
                  ...s,
                  turnTimerSeconds: Math.min(MAX_TIMER_SECONDS, s.turnTimerSeconds + TIMER_STEP_SECONDS),
                }))
              }
            />
          </div>
        </div>

        <div>
          <div className="mx-0.5 mb-2 font-body text-[11px] font-extrabold tracking-[.12em] text-fg-muted uppercase">
            {t('section.extras')}
          </div>
          <div className="flex flex-col gap-2.5">
            <ToggleRow
              icon="🎖"
              label={t('roles.label')}
              sub={t('roles.sub')}
              on={settings.rolesEnabled}
              onToggle={() => setSettings((s) => ({ ...s, rolesEnabled: !s.rolesEnabled }))}
            />
            <ToggleRow
              icon="🎴"
              label={t('events.label')}
              sub={t('events.sub')}
              on={settings.eventsEnabled}
              onToggle={() => setSettings((s) => ({ ...s, eventsEnabled: !s.eventsEnabled }))}
            />
            <ToggleRow
              icon="🤝"
              label={t('teams.label')}
              sub={t('teams.sub')}
              on={false}
              disabled
              soon
              onToggle={() => {}}
            />
          </div>
        </div>
      </div>

      <Footer variant="gradient" error={error}>
        <Button type="submit" disabled={submitting}>
          {submitting ? t('submit.busy') : t('submit.idle')}
        </Button>
      </Footer>
    </form>
  )
}
