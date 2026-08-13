import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RoleAssignmentModeDto,
  SetupModeDto,
  WinConditionDto,
  type CreateGameResponse,
  type GameSettingsDto,
  type StartingArmiesPresetDto,
} from '../types/GameSettings'
import { ToggleRow } from './ui/ToggleRow'
import { Stepper } from './ui/Stepper'
import { SelectableOption } from './ui/SelectableOption'
import { SegmentedControl } from './ui/SegmentedControl'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import { GlassPanel } from './ui/GlassPanel'
import type { ValidationError } from '../types/ValidationError'
import { translateValidationErrors } from '../i18n/hubError'
import { tDynamic } from '../i18n/useT'

/** FO §10-standaardwaarden. Roltoewijzing en verplaatsen-timer hebben geen bediening
 * in het design (Instellingen-scherm) en blijven daarom op hun default staan — geen
 * invulruimte, zie CLAUDE.md. `startingArmiesPresetId` valt terug op "classic" totdat
 * `/maps/{mapId}/starting-armies-presets` teruggekomen is. */
const DEFAULT_SETTINGS: GameSettingsDto = {
  winCondition: WinConditionDto.SecretMissions,
  setupMode: SetupModeDto.Random,
  startingArmiesPresetId: 'classic',
  turnTimerSeconds: 180,
  fortifyTimerSeconds: 60,
  rolesEnabled: true,
  roleAssignment: RoleAssignmentModeDto.Random,
  eventsEnabled: true,
}

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
  const [presets, setPresets] = useState<StartingArmiesPresetDto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/maps/${mapId}/starting-armies-presets`)
      .then((response) => (response.ok ? (response.json() as Promise<StartingArmiesPresetDto[]>) : []))
      .then((loaded) => {
        if (!cancelled) {
          setPresets(loaded)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [mapId])

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

  const winConditionDescription =
    settings.winCondition === WinConditionDto.WorldDomination
      ? t('winCondition.worldDomination.description')
      : t('winCondition.secretMissions.description')

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col text-fg">
      {/* BEVINDING, opgelost (2026-08-10): kaal op de stage-achtergrond, zie OrderRollWaitStep.tsx. */}
      <GlassPanel elevation="base" context="phone" padding="none" className="mx-gutter mt-gutter flex-none rounded-2xl px-4 py-3">
        <h1 className="font-display text-h1 font-black">{t('header.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('map.summary')}</p>
      </GlassPanel>

      {/* Geen `PhoneScreen`: dit scherm is een `<form>` met een vaste kop, een scrollend
          midden en een footer — het frame zit daarom per sectie, op dezelfde
          `--spacing-gutter` als elk ander telefoonscherm. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-gutter pb-gutter">
        <div>
          <div className="mb-2 font-body text-xs font-extrabold tracking-[var(--tracking-wide)] text-fg-muted uppercase">
            {t('section.rules')}
          </div>
          <div className="flex flex-col gap-2.5">
            <GlassPanel elevation="base" context="phone" padding="none" className="rounded-card px-3.5 py-3">
              <div className="mb-2 font-display text-base font-extrabold">{t('winCondition.title')}</div>
              <SegmentedControl
                value={settings.winCondition}
                onChange={(winCondition) => setSettings((s) => ({ ...s, winCondition }))}
                options={[
                  {
                    value: WinConditionDto.WorldDomination,
                    label: t('winCondition.worldDomination.title'),
                  },
                  {
                    value: WinConditionDto.SecretMissions,
                    label: t('winCondition.secretMissions.title'),
                  },
                ]}
              />
              <p className="mt-2 text-xs text-fg-muted">{winConditionDescription}</p>
            </GlassPanel>

            <GlassPanel elevation="base" context="phone" padding="none" className="rounded-card px-3.5 py-3">
              <div className="mb-0.5 font-display text-base font-extrabold">{t('setupMode.title')}</div>
              <div className="mb-2.5 text-xs text-fg-muted">{t('setupMode.description')}</div>
              <SegmentedControl
                value={settings.setupMode}
                onChange={(setupMode) => setSettings((s) => ({ ...s, setupMode }))}
                options={[
                  { value: SetupModeDto.Random, label: t('setupMode.random') },
                  { value: SetupModeDto.Claiming, label: t('setupMode.claiming') },
                ]}
              />
            </GlassPanel>

            <GlassPanel elevation="base" context="phone" padding="none" className="rounded-card px-3.5 py-3">
              <div className="mb-0.5 font-display text-base font-extrabold">{t('startingArmies.title')}</div>
              <div className="mb-2.5 text-xs text-fg-muted">{t('startingArmies.description')}</div>
              <div role="radiogroup" aria-label={t('startingArmies.title')} className="flex flex-col gap-2">
                {presets.map((preset) => (
                  <SelectableOption
                    key={preset.id}
                    selected={settings.startingArmiesPresetId === preset.id}
                    onSelect={() => setSettings((s) => ({ ...s, startingArmiesPresetId: preset.id }))}
                    className="flex flex-col gap-1 px-3 py-2.5 text-left"
                  >
                    <span className="font-display font-bold">
                      {tDynamic(`startingArmies.preset.${preset.id}.title`, 'createGame')}
                    </span>
                    <p className="text-xs text-fg-muted">
                      {tDynamic(`startingArmies.preset.${preset.id}.description`, 'createGame')}
                    </p>
                  </SelectableOption>
                ))}
              </div>
            </GlassPanel>

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
          <div className="mb-2 font-body text-xs font-extrabold tracking-[var(--tracking-wide)] text-fg-muted uppercase">
            {t('section.extras')}
          </div>
          <div className="flex flex-col gap-2.5">
            <ToggleRow
              label={t('roles.label')}
              sub={t('roles.sub')}
              on={settings.rolesEnabled}
              onToggle={() => setSettings((s) => ({ ...s, rolesEnabled: !s.rolesEnabled }))}
            />
            <ToggleRow
              label={t('events.label')}
              sub={t('events.sub')}
              on={settings.eventsEnabled}
              onToggle={() => setSettings((s) => ({ ...s, eventsEnabled: !s.eventsEnabled }))}
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
