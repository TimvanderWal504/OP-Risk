import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto, TerritoryDto } from '../types/GameState'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import { tDynamic } from '../i18n/useT'
import { ArmyStepperRow } from './ui/ArmyStepperRow'
import { Button } from './ui/Button'
import { Collapsible } from './ui/Collapsible'
import { GlassPanel } from './ui/GlassPanel'
import { PhoneScreen } from './ui/PhoneScreen'
import { StatHeaderCard } from './ui/StatHeaderCard'

export interface RemoveArmiesStepProps {
  eventId: string
  /** Hoeveel legers in totaal af moeten (`PendingAttritionDto.amount`). */
  amount: number
  myTerritories: TerritoryDto[]
  myColor: PlayerColorDto | null
  territoryCatalog: TerritoryCatalogDto[]
  /** Gebied → aantal áfgestane legers; de server valideert opnieuw (`RemoveArmies`). */
  onConfirm: (removalsByTerritory: Record<string, number>) => Promise<void>
}

/**
 * "Legers verwijderen" (FO §9.2, DESIGN.md § Event Round): het Versterken-scherm omgekeerd. Alleen
 * gebieden die een leger kunnen missen staan erin; de rest noemt één gedempte regel. `−` haalt een
 * leger weg, `+` zet het terug; "Bevestigen" pas als het totaal exact klopt. De keuze blijft lokaal
 * tot bevestigen — geen optimistische state (frontend/CLAUDE.md).
 */
export function RemoveArmiesStep({ eventId, amount, myTerritories, myColor, territoryCatalog, onConfirm }: RemoveArmiesStepProps) {
  const { t } = useTranslation('eventPhone')
  const [removed, setRemoved] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const spareable = myTerritories.filter((territory) => territory.armyCount > 1)
  const unavailableCount = myTerritories.length - spareable.length
  const left = amount - Object.values(removed).reduce((sum, count) => sum + count, 0)

  const continentOf = (territoryId: string) =>
    territoryCatalog.find((entry) => entry.id === territoryId)?.continent ?? 'unknown'
  const continentGroups = Array.from(new Set(spareable.map((territory) => continentOf(territory.territoryId)))).map(
    (continent) => ({
      continent,
      territories: spareable.filter((territory) => continentOf(territory.territoryId) === continent),
    }),
  )

  const change = (territoryId: string, delta: number) =>
    setRemoved((current) => ({ ...current, [territoryId]: (current[territoryId] ?? 0) + delta }))

  const confirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm(Object.fromEntries(Object.entries(removed).filter(([, count]) => count > 0)))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PhoneScreen>
      <StatHeaderCard
        title={t('remove.title', { count: amount })}
        statValue={left}
        statLabel={t('remove.left')}
        paddingY={12}
        accentColor="silver"
        hint={<span className="font-body text-sm text-fg-secondary">{tDynamic(`${eventId}.name`, 'events')}</span>}
      />

      <div className="mt-[11px] flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
        {continentGroups.map((group) => (
          <GlassPanel key={group.continent} elevation="base" context="phone" padding="none" className="rounded-[14px] px-[13px] py-[11px]">
            <Collapsible
              collapsible={continentGroups.length >= 2}
              defaultOpen
              title={
                <span className="font-body text-label font-extrabold uppercase tracking-[.1em] text-fg-muted">
                  {tDynamic(group.continent, 'continents')}
                </span>
              }
            >
              {group.territories.map((territory) => {
                const removedHere = removed[territory.territoryId] ?? 0
                const after = territory.armyCount - removedHere

                return (
                  <ArmyStepperRow
                    key={territory.territoryId}
                    incrementOnly={false}
                    color={myColor}
                    label={tDynamic(territory.territoryId, 'territories')}
                    baseArmyCount={territory.armyCount}
                    armyCount={after}
                    delta={-removedHere}
                    // `+` zet een leger terug, `−` haalt er een weg — nooit onder 1.
                    canIncrement={removedHere > 0}
                    canDecrement={after > 1 && left > 0}
                    onIncrement={() => change(territory.territoryId, -1)}
                    onDecrement={() => change(territory.territoryId, 1)}
                  />
                )
              })}
            </Collapsible>
          </GlassPanel>
        ))}

        {unavailableCount > 0 && (
          <p className="m-0 px-1 font-body text-sm text-fg-muted">{t('remove.unavailable', { count: unavailableCount })}</p>
        )}
      </div>

      <Button className="mt-[11px]" disabled={left !== 0 || submitting} onClick={confirm}>
        {t('remove.confirm')}
      </Button>
    </PhoneScreen>
  )
}
