import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto, ReinforcementBreakdownDto, TerritoryDto } from '../types/GameState'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import { ArmyStepperRow } from './ui/ArmyStepperRow'
import { Collapsible } from './ui/Collapsible'
import { GlassPanel } from './ui/GlassPanel'
import { StatHeaderCard } from './ui/StatHeaderCard'
import { shadowGlowPitch } from '../styles/design-tokens'
import { tDynamic } from '../i18n/useT'
import { PhoneScreen } from './ui/PhoneScreen'

export interface PlaceReinforcementStepProps {
  myTerritories: TerritoryDto[]
  myColor: PlayerColorDto | null
  territoryCatalog: TerritoryCatalogDto[]
  /** `TurnStateDto.armiesRemaining` — server-waarheid, alleen deze waarde daalt bij een
   *  bevestigde plaatsing. Nooit lokaal herberekend. */
  armiesLeft: number
  breakdown: ReinforcementBreakdownDto | null
  onConfirmPlacements: (placements: { territoryId: string; amount: number }[]) => Promise<void>
  onEndPhase: () => Promise<void>
}

/**
 * Versterken · Legers verdelen. Stage-then-confirm: decrement raakt nooit de server, één
 * `PlaceReinforcements`-call per gebied bij bevestigen (niet N losse calls van 1 — zie het
 * Reinforce-plan). Het "Kaarteninleg"-blok ontbreekt bewust, zie `locales/reinforce.ts`.
 */
export function PlaceReinforcementStep({
  myTerritories,
  myColor,
  territoryCatalog,
  armiesLeft,
  breakdown,
  onConfirmPlacements,
  onEndPhase,
}: PlaceReinforcementStepProps) {
  const { t } = useTranslation('reinforce')
  const [staged, setStaged] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const totalStaged = Object.values(staged).reduce((sum, amount) => sum + amount, 0)
  const remainingToStage = armiesLeft - totalStaged
  const canStageMore = remainingToStage > 0

  const inc = (territoryId: string) => {
    if (!canStageMore) return
    setStaged((current) => ({ ...current, [territoryId]: (current[territoryId] ?? 0) + 1 }))
  }

  const dec = (territoryId: string) => {
    if (!(staged[territoryId] > 0)) return
    setStaged((current) => ({ ...current, [territoryId]: current[territoryId] - 1 }))
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onConfirmPlacements(
        Object.entries(staged)
          .filter(([, amount]) => amount > 0)
          .map(([territoryId, amount]) => ({ territoryId, amount })),
      )
      setStaged({})
    } finally {
      setSubmitting(false)
    }
  }

  const isDone = armiesLeft === 0
  const readyToConfirm = !isDone && remainingToStage === 0 && totalStaged > 0

  const buttonLabel = isDone
    ? t('doneLabel')
    : readyToConfirm
      ? t('confirmLabel')
      : t('placeAllFirst', { count: remainingToStage })
  const buttonEnabled = (isDone || readyToConfirm) && !submitting
  const buttonAction = isDone ? onEndPhase : readyToConfirm ? handleConfirm : undefined

  const continentOf = (territoryId: string) =>
    territoryCatalog.find((entry) => entry.id === territoryId)?.continent ?? 'unknown'

  const continentGroups = Array.from(new Set(myTerritories.map((t) => continentOf(t.territoryId)))).map(
    (continent) => ({
      continent,
      territoryIds: myTerritories.filter((t) => continentOf(t.territoryId) === continent).map((t) => t.territoryId),
      totalInContinent: territoryCatalog.filter((entry) => entry.continent === continent).length,
    }),
  )

  const breakdownRows = breakdown
    ? [
        {
          label: t('territoriesRow', { count: myTerritories.length }),
          value: breakdown.baseArmies,
          color: 'text-fg',
        },
        { label: t('continentBonusRow'), value: breakdown.continentBonus, color: undefined },
        { label: t('roleBonusRow'), value: breakdown.roleBonus, color: undefined },
        { label: t('eventBonusRow'), value: breakdown.eventBonus, color: undefined },
      ]
    : []

  return (
    <PhoneScreen>
      <StatHeaderCard
        title={t('distribute')}
        statValue={remainingToStage}
        statLabel={t('toPlace')}
        paddingY={12}
        accentColor="pitch"
      />

      <div className="mt-[11px] flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
        {breakdown && (
          <GlassPanel elevation="base" context="phone" padding="none" className="rounded-[14px] px-[13px] py-[11px]">
            <div className="mb-2 font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted">
              {t('buildup')}
            </div>
            {breakdownRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1">
                <span className="font-body text-[16px] text-fg-secondary">{row.label}</span>
                <span
                  className={`font-display text-[16px] font-extrabold ${row.value > 0 ? 'text-pitch-300' : 'text-fg-muted'}`}
                >
                  +{row.value}
                </span>
              </div>
            ))}
          </GlassPanel>
        )}

        {continentGroups.map((group) => {
          const stagedInGroup = group.territoryIds.reduce((sum, id) => sum + (staged[id] ?? 0), 0)

          return (
            // `Collapsible` is bewust achtergrondloos (generiek); paneel eromheen zodat de
            // continent-kicker leesbaar blijft op de stage-achtergrond.
            <GlassPanel key={group.continent} elevation="base" context="phone" padding="none" className="rounded-[14px] px-[13px] py-[11px]">
              <Collapsible
                collapsible={continentGroups.length >= 2}
                defaultOpen={continentGroups.length < 2}
                title={
                  <span className="font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted">
                    {tDynamic(group.continent, 'continents')}
                  </span>
                }
                summary={
                  <span className="font-body text-[16px] text-fg-muted">
                    {group.territoryIds.length}/{group.totalInContinent}
                    {stagedInGroup > 0 && ` · +${stagedInGroup}`}
                  </span>
                }
              >
                {group.territoryIds.map((territoryId) => {
                  const territory = myTerritories.find((t) => t.territoryId === territoryId)!

                  return (
                    <ArmyStepperRow
                      key={territoryId}
                      incrementOnly={false}
                      color={myColor}
                      label={tDynamic(territoryId, 'territories')}
                      baseArmyCount={territory.armyCount}
                      armyCount={territory.armyCount + (staged[territoryId] ?? 0)}
                      delta={staged[territoryId] ?? 0}
                      canIncrement={canStageMore}
                      canDecrement={(staged[territoryId] ?? 0) > 0}
                      onIncrement={() => inc(territoryId)}
                      onDecrement={() => dec(territoryId)}
                    />
                  )
                })}
              </Collapsible>
            </GlassPanel>
          )
        })}
      </div>

      <button
        type="button"
        disabled={!buttonEnabled}
        onClick={buttonAction}
        className="mt-[11px] flex min-h-[62px] w-full items-center justify-center gap-2.5 rounded-2xl font-display text-xl font-black disabled:cursor-not-allowed"
        style={{
          background: buttonEnabled ? 'var(--pitch-500)' : 'var(--border-strong)',
          color: buttonEnabled ? 'var(--on-pitch)' : 'var(--fg-muted)',
          boxShadow: buttonEnabled ? shadowGlowPitch : 'none',
        }}
      >
        {buttonLabel}
      </button>
    </PhoneScreen>
  )
}
