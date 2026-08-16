import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto, TerritoryDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { GlassPanel } from './ui/GlassPanel'
import { Button } from './ui/Button'
import { Footer } from './ui/Footer'
import { tDynamic } from '../i18n/useT'
import { PhoneScreen } from './ui/PhoneScreen'

export interface FortifyFlowStepProps {
  myTerritories: TerritoryDto[]
  myColor: PlayerColorDto | null
  /** Server-waarheid (FO §5.2 Kernregel: "één verplaatsing") — géén lokale substaat. Zodra dit
   *  `true` wordt (ook na reconnect/refresh), toont dit component altijd de done-weergave. */
  hasFortified: boolean
  /** `TurnStateDto.reachableFortifyGroups` — zie de doc-comment bovenaan dit bestand. */
  reachableGroups: string[][]
  error: string | null
  onFortify: (fromTerritoryId: string, toTerritoryId: string, armiesToMove: number) => Promise<boolean>
  onEndTurn: () => Promise<boolean>
}

type Phase = 'src' | 'tgt' | 'amount'

/** Onthouden intentie vóór de `onFortify`-aanroep — nodig voor de bevestigingstekst op de
 *  done-weergave, want ná de move zijn de servergetallen alweer gewijzigd. */
interface PendingIntent {
  from: string
  to: string
  amount: number
}

/**
 * Verplaatsen (`TurnPhaseDto.Fortify`, FO §5.2) · kern-flow voor de actieve speler. Geen
 * letterlijke DESIGN.md-sectie (het oorspronkelijke design kende geen Fortify-fase) — de
 * `amount`-stap volgt daarom bewust het bestaande `ConquestMoveStep`-idioom (kleurbadges +
 * pijl + grote gecentreerde stepper): functioneel dezelfde interactie (al gekozen bron/doel,
 * kies een aantal, bevestig), dus hetzelfde vocabulaire i.p.v. de generieke rij-`Stepper`
 * (die bedoeld is voor lijsten van meerdere gebieden tegelijk, een andere context).
 *
 * De doellijst op `tgt` toont alleen gebieden die de server als bereikbaar aanmerkt
 * (`reachableGroups`, gevuld via `FortifyGuards.ReachableComponents`): FO §5.2 staat een pad over
 * meerdere eigen gebieden toe, maar dat pad-budget hangt af van effect-state
 * (`FortifyUpgrade`/`SeaRoutesBlocked`/`TerritoryLocked`) die alleen de server kent. Dat clientside
 * naspelen zou een spelregel herbouwen (frontend/CLAUDE.md) — vandaar dat de server de bereikbare
 * groepen aanlevert i.p.v. dat de client zelf een pad-algoritme draait. Bereikbaarheid is
 * symmetrisch (grenzen zijn ongericht), dus "bereikbaar vanuit X" = de rest van X's groep.
 */
export function FortifyFlowStep({
  myTerritories,
  myColor,
  hasFortified,
  reachableGroups,
  error,
  onFortify,
  onEndTurn,
}: FortifyFlowStepProps) {
  const { t } = useTranslation('fortify')

  const [phase, setPhase] = useState<Phase>('src')
  const [fromTerritoryId, setFromTerritoryId] = useState<string | null>(null)
  const [toTerritoryId, setToTerritoryId] = useState<string | null>(null)
  const [amount, setAmount] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [pendingIntent, setPendingIntent] = useState<PendingIntent | null>(null)
  // Gekoppeld aan de combinatie waarop de fout ontstond (niet een losse boolean): navigeer je
  // terug en kies je een andere combinatie, dan wijkt de vergelijking af en verdwijnt de oude
  // melding vanzelf — geen aparte reset-code nodig op de terugknoppen.
  const [lastFailedAttempt, setLastFailedAttempt] = useState<{ from: string; to: string } | null>(null)
  // Losse, niet-parametrische actie (geen paar om aan te koppelen): bij elke nieuwe poging eerst
  // op `false` gezet, dus "opnieuw proberen" overschrijft de vorige uitkomst altijd.
  const [endTurnFailed, setEndTurnFailed] = useState(false)

  const handleEndTurn = async () => {
    setSubmitting(true)
    setEndTurnFailed(false)
    try {
      const ok = await onEndTurn()
      if (!ok) setEndTurnFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (hasFortified) {
    return (
      <PhoneScreen>
        <GlassPanel elevation="base" context="phone" padding="none" className="my-auto rounded-2xl p-4 text-center">
          <div className="font-display text-h2 font-extrabold text-fg">
            {pendingIntent
              ? t('done.confirmationWithDetail', {
                  amount: pendingIntent.amount,
                  from: tDynamic(pendingIntent.from, 'territories'),
                  to: tDynamic(pendingIntent.to, 'territories'),
                })
              : t('done.genericConfirmation')}
          </div>
        </GlassPanel>
        <Footer error={endTurnFailed ? error : null}>
          <Button disabled={submitting} onClick={handleEndTurn}>
            {t('done.endTurn')}
          </Button>
        </Footer>
      </PhoneScreen>
    )
  }

  const pickSrc = (territoryId: string) => {
    setFromTerritoryId(territoryId)
    setPhase('tgt')
  }

  const pickTgt = (territoryId: string) => {
    setToTerritoryId(territoryId)
    setAmount(1)
    setPhase('amount')
  }

  const backToSrc = () => {
    setFromTerritoryId(null)
    setToTerritoryId(null)
    setPhase('src')
  }

  const backToTgt = () => {
    setToTerritoryId(null)
    setPhase('tgt')
  }

  const fromArmyCount = fromTerritoryId ? (myTerritories.find((t) => t.territoryId === fromTerritoryId)?.armyCount ?? 0) : 0
  const maxAmount = Math.max(1, fromArmyCount - 1)
  const clamped = Math.max(1, Math.min(maxAmount, amount))

  const confirmFortify = async () => {
    if (!fromTerritoryId || !toTerritoryId) return

    setPendingIntent({ from: fromTerritoryId, to: toTerritoryId, amount: clamped })
    setSubmitting(true)
    try {
      const ok = await onFortify(fromTerritoryId, toTerritoryId, clamped)
      if (!ok) {
        setLastFailedAttempt({ from: fromTerritoryId, to: toTerritoryId })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Minstens één ander eigen gebied moet bestaan, anders is er nooit een geldig doelgebied
  // (voorkomt een lege doellijst op `tgt` zonder uitweg — nettere fix dan pas daar afvangen).
  const hasOtherTerritory = myTerritories.length >= 2
  const eligibleSources = hasOtherTerritory ? myTerritories.filter((territory) => territory.armyCount >= 2) : []

  const reachableIds = new Set(reachableGroups.find((group) => fromTerritoryId !== null && group.includes(fromTerritoryId)) ?? [])
  const targets = fromTerritoryId
    ? myTerritories.filter((territory) => territory.territoryId !== fromTerritoryId && reachableIds.has(territory.territoryId))
    : []

  const showFortifyError =
    lastFailedAttempt !== null && lastFailedAttempt.from === fromTerritoryId && lastFailedAttempt.to === toTerritoryId

  return (
    <PhoneScreen>
      {phase === 'src' && (
        <>
          <GlassPanel elevation="base" context="phone" padding="none" className="mb-3 inline-block self-start rounded-2xl px-4 py-2">
            <div className="font-display text-xl font-extrabold">{t('pickSrc.title')}</div>
            <div className="font-body text-sm text-fg-muted">{t('pickSrc.subtitle')}</div>
          </GlassPanel>
          <div className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto">
            {eligibleSources.length === 0 && <div className="font-body text-sm text-fg-muted">{t('pickSrc.empty')}</div>}
            {eligibleSources.map((territory) => (
              <GlassPanel key={territory.territoryId} elevation="base" context="phone" padding="none" className="rounded-2xl">
                <button
                  type="button"
                  onClick={() => pickSrc(territory.territoryId)}
                  className="flex min-h-16 w-full items-center gap-3 px-3.5 text-left text-fg"
                >
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-h3"
                    style={{ background: myColor?.hex, color: myColor?.onHex }}
                  >
                    {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-h3 font-extrabold">{tDynamic(territory.territoryId, 'territories')}</div>
                    <div className="font-body text-sm text-fg-muted">
                      {territory.armyCount} {t('armiesWord')}
                    </div>
                  </div>
                </button>
              </GlassPanel>
            ))}
          </div>
          <Footer error={endTurnFailed ? error : null}>
            <Button variant="secondary" disabled={submitting} onClick={handleEndTurn}>
              {t('pickSrc.skipTurn')}
            </Button>
          </Footer>
        </>
      )}

      {phase === 'tgt' && fromTerritoryId && (
        <>
          <GlassPanel elevation="base" context="phone" padding="none" className="mb-3 inline-block self-start rounded-2xl px-4 py-2">
            <div className="font-display text-xl font-extrabold">{t('pickTgt.title')}</div>
            <div className="font-body text-sm text-fg-muted">
              {t('pickTgt.from')} <b className="text-fg">{tDynamic(fromTerritoryId, 'territories')}</b>
            </div>
          </GlassPanel>
          <div className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto">
            {targets.length === 0 && <div className="font-body text-sm text-fg-muted">{t('pickTgt.empty')}</div>}
            {targets.map((target) => (
              <GlassPanel key={target.territoryId} elevation="base" context="phone" padding="none" className="rounded-2xl">
                <button
                  type="button"
                  onClick={() => pickTgt(target.territoryId)}
                  className="flex min-h-16 w-full items-center gap-3 px-3.5 text-left text-fg"
                >
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-h3"
                    style={{ background: myColor?.hex, color: myColor?.onHex }}
                  >
                    {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-h3 font-extrabold">{tDynamic(target.territoryId, 'territories')}</div>
                    <div className="font-body text-sm text-fg-muted">
                      {target.armyCount} {t('armiesWord')}
                    </div>
                  </div>
                </button>
              </GlassPanel>
            ))}
          </div>
          <Button variant="secondary" onClick={backToSrc} className="mt-3 min-h-[46px] text-sm">
            {t('pickTgt.back')}
          </Button>
        </>
      )}

      {phase === 'amount' && fromTerritoryId && toTerritoryId && (
        <>
          <GlassPanel elevation="base" context="phone" padding="none" className="mb-3 inline-block self-start rounded-2xl px-4 py-2">
            <div className="font-display text-xl font-extrabold">{t('amount.title')}</div>
            <div className="font-body text-sm text-fg-muted">
              <b className="text-fg">{tDynamic(fromTerritoryId, 'territories')}</b> → <b className="text-fg">{tDynamic(toTerritoryId, 'territories')}</b>
            </div>
          </GlassPanel>

          <GlassPanel elevation="base" context="phone" padding="none" className="my-auto grid gap-[22px] rounded-2xl p-4 text-center">
            <div className="grid grid-cols-[1fr_auto_1fr] items-start justify-items-center gap-3">
              <div>
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-h2"
                  style={{ background: myColor?.hex, color: myColor?.onHex }}
                >
                  {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
                </div>
                <div className="mt-[5px] font-body text-sm text-fg-secondary">{tDynamic(fromTerritoryId, 'territories')}</div>
              </div>
              <span className="self-center text-2xl text-pitch-400">→</span>
              <div>
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-h2"
                  style={{ background: myColor?.hex, color: myColor?.onHex, boxShadow: myColor ? `0 0 20px ${myColor.hex}` : undefined }}
                >
                  {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
                </div>
                <div className="mt-[5px] font-body text-sm text-fg-secondary">{tDynamic(toTerritoryId, 'territories')}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-[18px]">
              <button
                type="button"
                disabled={clamped <= 1}
                onClick={() => setAmount((current) => Math.max(1, current - 1))}
                className="flex h-15 w-15 items-center justify-center justify-self-end rounded-2xl border-2 text-h1 font-black text-fg disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                −
              </button>
              <div>
                <div className="font-display text-display font-black leading-none text-fg">{clamped}</div>
                <div className="font-body text-body text-fg-muted">{t('armiesWord')}</div>
              </div>
              <button
                type="button"
                disabled={clamped >= maxAmount}
                onClick={() => setAmount((current) => Math.min(maxAmount, current + 1))}
                className="h-15 w-15 justify-self-start rounded-2xl border-none bg-pitch-500 text-h1 font-black text-[var(--on-pitch)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            <div className="font-body text-sm text-fg-muted">
              {t('amount.minNote', { territory: tDynamic(fromTerritoryId, 'territories') })}
            </div>
          </GlassPanel>

          <Footer error={showFortifyError ? error : null}>
            <Button disabled={submitting} onClick={confirmFortify}>
              {t('amount.confirm')}
            </Button>
            <Button variant="secondary" disabled={submitting} onClick={backToTgt} className="min-h-[46px] text-sm">
              {t('amount.back')}
            </Button>
          </Footer>
        </>
      )}
    </PhoneScreen>
  )
}
