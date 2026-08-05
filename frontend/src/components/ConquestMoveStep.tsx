import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { tDynamic } from '../i18n/useT'

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
 * "6 CONQUEST" (`isConquest`-fase in het oorspronkelijke design). `moveN` klemt lokaal tussen
 * `minArmies`/`maxArmies` — beide servergetallen (`pendingCombat.attackDice` resp. de verse
 * bronlegerstand), geen herberekende spelregel.
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
    <div className="flex flex-1 flex-col min-h-0 p-4 pt-0.5">
      <div className="mt-1.5 text-center">
        <span className="font-body text-xs font-extrabold uppercase tracking-[.18em] text-pitch-300">{t('conquest.captured')}</span>
        <div className="mt-1.5 font-display text-[28px] font-black">{tDynamic(toTerritoryId, 'territories')}</div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[22px]">
        <div className="flex items-center gap-3.5">
          <div className="text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-[26px]"
              style={{ background: myColor?.hex, color: myColor?.onHex }}
            >
              {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
            </div>
            <div className="mt-[5px] font-body text-xs text-fg-muted">{tDynamic(fromTerritoryId, 'territories')}</div>
          </div>
          <span className="text-2xl text-pitch-400">→</span>
          <div className="text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-[26px]"
              style={{ background: myColor?.hex, color: myColor?.onHex, boxShadow: myColor ? `0 0 20px ${myColor.hex}` : undefined }}
            >
              {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
            </div>
            <div className="mt-[5px] font-body text-xs text-fg-muted">{tDynamic(toTerritoryId, 'territories')}</div>
          </div>
        </div>

        <div className="text-center font-body text-sm text-fg-muted">{t('conquest.moveHowMany')}</div>

        <div className="flex items-center gap-[18px]">
          <button
            type="button"
            disabled={clamped <= minArmies}
            onClick={() => setMoveN((current) => Math.max(minArmies, current - 1))}
            className="h-15 w-15 rounded-2xl border border-border-strong bg-[var(--atlas-t05)] text-[30px] font-black text-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <div className="min-w-[70px] text-center">
            <div className="font-display text-[52px] font-black leading-none">{clamped}</div>
            <div className="font-body text-[11px] text-fg-muted">{t('armiesWord')}</div>
          </div>
          <button
            type="button"
            disabled={clamped >= maxArmies}
            onClick={() => setMoveN((current) => Math.min(maxArmies, current + 1))}
            className="h-15 w-15 rounded-2xl border-none bg-pitch-500 text-[30px] font-black text-[var(--on-pitch)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        <div className="font-body text-xs text-silver-400">{t('conquest.minNote', { min: minArmies })}</div>
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={confirm}
        className="mt-[11px] flex min-h-16 w-full items-center justify-center gap-2.5 rounded-2xl border-none font-display text-lg font-black text-[var(--on-pitch)] disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: 'var(--pitch-500)', boxShadow: 'var(--shadow-glow-pitch)' }}
      >
        {t('conquest.confirm')}
      </button>
    </div>
  )
}
