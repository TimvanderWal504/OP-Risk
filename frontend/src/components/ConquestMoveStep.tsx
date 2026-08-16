import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { GlassPanel } from './ui/GlassPanel'
import { tDynamic } from '../i18n/useT'
import { PhoneScreen } from './ui/PhoneScreen'

export interface ConquestMoveStepProps {
  fromTerritoryId: string
  toTerritoryId: string
  myColor: PlayerColorDto | null
  /** `pendingCombat.attackDice` — servergetal, geen afgeleide regel (zie het bouwplan). */
  minArmies: number
  /** Verse `fromArmyCount - 1` — servergetal. */
  maxArmies: number
  onConfirm: (armiesToMove: number) => Promise<void>
}

/**
 * "6 CONQUEST"-scherm. `moveN` klemt lokaal tussen `minArmies`/`maxArmies` — beide
 * servergetallen (`pendingCombat.attackDice` resp. de verse bronlegerstand), geen
 * herberekende spelregel.
 */
export function ConquestMoveStep({ fromTerritoryId, toTerritoryId, myColor, minArmies, maxArmies, onConfirm }: ConquestMoveStepProps) {
  const { t } = useTranslation('attack')
  const [moveN, setMoveN] = useState(minArmies)
  const [submitting, setSubmitting] = useState(false)

  const clamped = Math.max(minArmies, Math.min(maxArmies, moveN))

  const confirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm(clamped)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PhoneScreen>
      {/* Grid met gelijk ritme (`gap-[22px]`) i.p.v. een kop plus gecentreerd restblok: het
          paneel is zo hoog als zijn inhoud en elke rij krijgt evenveel ruimte. */}
      {/* `my-auto`: de vrije ruimte valt gelijk boven en onder het paneel, gecentreerd in wat de
          CTA onderaan overlaat. Geen `flex-1` — dat zou het paneel weer uitrekken. */}
      <GlassPanel elevation="base" context="phone" padding="none" className="my-auto grid gap-[22px] rounded-2xl p-4 text-center">
        <div className="font-display text-[28px] font-black leading-[1.15] text-fg">
          {t('conquest.captured', { territory: tDynamic(toTerritoryId, 'territories') })}
        </div>

        {/* Herkomst en doel krijgen elk een gelijke 1fr-kolom, met de pijl in een auto-kolom
            ertussen. Zo staat de pijl op de middenlijn en verspringt er niets bij een lange
            gebiedsnaam — die wikkelt binnen zijn eigen kolom. */}
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

        <div className="font-body text-body text-fg-secondary">{t('conquest.moveHowMany')}</div>

        {/* Drie gelijke kolommen: de teller staat daardoor op de middenlijn van het paneel en de
            twee knoppen hangen symmetrisch aan weerszijden, ongeacht hoeveel cijfers de teller heeft. */}
        <div className="grid grid-cols-3 items-center gap-[18px]">
          <button
            type="button"
            disabled={clamped <= minArmies}
            onClick={() => setMoveN((current) => Math.max(minArmies, current - 1))}
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
            disabled={clamped >= maxArmies}
            onClick={() => setMoveN((current) => Math.min(maxArmies, current + 1))}
            className="h-15 w-15 justify-self-start rounded-2xl border-none bg-pitch-500 text-h1 font-black text-[var(--on-pitch)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        <div className="font-body text-sm text-fg-muted">{t('conquest.minNote', { min: minArmies })}</div>
      </GlassPanel>

      <button
        type="button"
        disabled={submitting}
        onClick={confirm}
        className="mt-auto flex min-h-16 w-full items-center justify-center gap-2.5 rounded-2xl border-none font-display text-lg font-black text-[var(--on-pitch)] disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: 'var(--pitch-500)', boxShadow: 'var(--shadow-glow-pitch)' }}
      >
        {t('conquest.confirm')}
      </button>
    </PhoneScreen>
  )
}
