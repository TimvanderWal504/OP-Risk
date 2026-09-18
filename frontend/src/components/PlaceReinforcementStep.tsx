import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto, ReinforcementBreakdownDto, TerritoryDto } from '../types/GameState'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import type { CardDto } from '../types/Card'
import { ArmyStepperRow } from './ui/ArmyStepperRow'
import { Button } from './ui/Button'
import { Collapsible } from './ui/Collapsible'
import { GlassPanel } from './ui/GlassPanel'
import { StatHeaderCard } from './ui/StatHeaderCard'
import { CardsPanel } from './CardsPanel'
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
  hand: CardDto[]
  myTerritoryIds: Set<string>
  /** Server-berekend (FO §4.4): of er ergens in `hand` een geldige inlegset zit — bepaalt of de
   *  "Leg kaarten in"-knop verschijnt, niet `hand.length` (frontend/CLAUDE.md). */
  hasTradeableCardSet: boolean
  mustTradeInCards: boolean
  onConfirmPlacements: (placements: { territoryId: string; amount: number }[]) => Promise<void>
  onTradeInCards: (cardIds: string[]) => Promise<void>
  /** Vuurt zodra alle legers geplaatst zijn (`armiesLeft === 0`, en `mustTradeInCards` niet
   *  meer openstaat — zie de `isDone`-doc-comment hieronder). De aanroeper bepaalt wat daarna
   *  gebeurt: in Versterken (`PhoneReinforceScreen`) is dat de fase beëindigen; in Aanvallen
   *  (`PhoneAttackScreen`, taak 6 — het ≥6-inleg-hergebruik van dit component) hoeft niets te
   *  gebeuren, de eigen render-logica daar valt vanzelf terug op `AttackFlowStep` zodra
   *  `armiesRemaining`/`mustTradeInCards` weer beide `false` zijn. Bewust hernoemd van
   *  `onEndPhase`: die naam klopte alleen voor de Versterken-aanroeper. */
  onAllPlaced: () => Promise<void>
  error: string | null
}

/**
 * Versterken · Legers verdelen. Stage-then-confirm: decrement raakt nooit de server, één
 * `PlaceReinforcements`-call per gebied bij bevestigen (niet N losse calls van 1 — zie het
 * Reinforce-plan).
 */
export function PlaceReinforcementStep({
  myTerritories,
  myColor,
  territoryCatalog,
  armiesLeft,
  breakdown,
  hand,
  hasTradeableCardSet,
  myTerritoryIds,
  mustTradeInCards,
  onConfirmPlacements,
  onTradeInCards,
  onAllPlaced,
  error,
}: PlaceReinforcementStepProps) {
  const { t } = useTranslation('reinforce')
  const [staged, setStaged] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  // Afgeleide open-staat i.p.v. een los `useEffect` dat op de *overgang* van
  // `mustTradeInCards` let: bij twee verplichte inlegs achter elkaar (bv. hand 8 → 5, nog
  // steeds ≥5) blijft `mustTradeInCards` van vóór naar ná de eerste inleg gewoon `true` — een
  // effect met `[mustTradeInCards]` als dependency zou dan niet opnieuw vuren en het paneel
  // zou dicht blijven terwijl de verplichting nog geldt. Met deze afleiding hoeft er niets te
  // "vuren": zolang de server `mustTradeInCards` teruggeeft is het paneel open, punt uit.
  const [voluntaryCardsOpen, setVoluntaryCardsOpen] = useState(false)
  const cardsOpen = mustTradeInCards || voluntaryCardsOpen

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

  // `&& !mustTradeInCards` (taak 6): direct na een eliminatie midden in Aanvallen kan
  // `armiesLeft` al 0 zijn terwijl er nog niets is ingelegd/geplaatst (de ≥6-inlegpool bestaat
  // dan nog niet). Zonder deze voorwaarde zou `onAllPlaced` hieronder een voltooide plaatsing
  // simuleren vóórdat de verplichte inleg zelfs maar is gestart. Verandert niets voor de
  // bestaande Versterken-aanroeper: bij 5+ kaarten start `armiesLeft` daar altijd al >0, en de
  // server weigert plaatsen zolang `mustTradeInCards` geldt — `armiesLeft` kan dus nooit op 0
  // uitkomen terwijl de verplichting daar nog openstaat.
  const isDone = armiesLeft === 0 && !mustTradeInCards
  const readyToConfirm = !isDone && remainingToStage === 0 && totalStaged > 0

  // Guard tegen dubbele `onAllPlaced`-calls (React StrictMode dubbelt effects in dev, en
  // `onAllPlaced` vanuit Aanvallen zonder lopend gevecht is óók geldig — een tweede call zou
  // dus niet falen maar in één klap doorschieten naar Verplaatsen, de Aanvalsfase overslaand).
  const allPlacedFired = useRef(false)

  useEffect(() => {
    if (isDone && !allPlacedFired.current) {
      allPlacedFired.current = true
      onAllPlaced()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone])

  const buttonLabel = readyToConfirm ? t('confirmLabel') : t('placeAllFirst', { count: remainingToStage })
  const buttonEnabled = readyToConfirm && !submitting
  const buttonAction = readyToConfirm ? handleConfirm : undefined

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
        // Anders dan de rijen hierboven: alleen zichtbaar bij > 0 (taak 4b-design-brief) —
        // er is geen "geen inleg deze fase"-rij om een 0 zinvol naast te tonen.
        ...(breakdown.cardTradeBonus > 0
          ? [{ label: t('cardTradeBonusRow'), value: breakdown.cardTradeBonus, color: undefined }]
          : []),
      ]
    : []

  return (
    <>
      <PhoneScreen>
        <StatHeaderCard
          title={t('distribute')}
          statValue={remainingToStage}
          statLabel={t('toPlace')}
          paddingY={12}
          accentColor="pitch"
        />

        {!isDone && hasTradeableCardSet && (
          <Button
            variant="secondary"
            className="mt-[11px] min-h-0 py-3 text-body"
            onClick={() => setVoluntaryCardsOpen(true)}
          >
            {t('tradeCardsButton')}
          </Button>
        )}

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

        {!isDone && (
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
        )}
      </PhoneScreen>

      {cardsOpen && (
        <CardsPanel
          hand={hand}
          myTerritoryIds={myTerritoryIds}
          hasTradeableCardSet={hasTradeableCardSet}
          mustTradeInCards={mustTradeInCards}
          initialMode="trade"
          onTradeInCards={onTradeInCards}
          onClose={() => setVoluntaryCardsOpen(false)}
          error={error}
        />
      )}
    </>
  )
}
