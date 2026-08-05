import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import type { CombatResultResponse } from '../types/HubResponses'
import { Dice, type DiceValue } from './ui/Dice'
import { ColorSymbol } from './ui/ColorSymbol'
import { tDynamic } from '../i18n/useT'

export interface DefendStepProps {
  attackerName: string
  attackerColor: PlayerColorDto | null
  myColor: PlayerColorDto | null
  fromTerritoryId: string
  toTerritoryId: string
  /** Legerstand van `toTerritoryId` (mijn gebied) — bepaalt de gedwongen 1-dobbelsteen-regel. */
  defenderArmyCount: number
  onChooseDefenseDice: (defenseDice: number) => Promise<CombatResultResponse | undefined>
}

/**
 * "7 DEFEND" (`isDefend`-fase in het oorspronkelijke design). Toont bij de keuzeknoppen bewust geen
 * aanvallerdobbelstenen (de export doet dat ook niet — een verdediger reconnect'end vlak
 * vóór zijn keuze kan gewoon kiezen zonder de gemiste `attack`-broadcast, zie het bouwplan).
 * Het resultaat komt rechtstreeks uit de `ChooseDefenseDice`-invoke-respons, geen
 * `CombatNarrated`-broadcast nodig voor de eigen weergave.
 */
export function DefendStep({
  attackerName,
  attackerColor,
  myColor,
  fromTerritoryId,
  toTerritoryId,
  defenderArmyCount,
  onChooseDefenseDice,
}: DefendStepProps) {
  const { t } = useTranslation('attack')
  const [result, setResult] = useState<CombatResultResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const forcedToOneDie = defenderArmyCount === 1

  const choose = async (defenseDice: number) => {
    setSubmitting(true)
    try {
      const response = await onChooseDefenseDice(defenseDice)
      if (response) setResult(response)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="absolute inset-0 z-[60] flex flex-col p-[52px_22px_22px]"
      style={{ background: 'linear-gradient(var(--live-soft),var(--bg))' }}
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3.5 text-center">
        <span className="font-body text-sm font-extrabold uppercase tracking-[.24em] text-[#ff5257]">
          ⚔ {t('defend.underAttack')}
        </span>
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
            style={{ background: attackerColor?.hex, color: attackerColor?.onHex }}
          >
            {attackerColor?.symbol && <ColorSymbol symbol={attackerColor.symbol} />}
          </div>
          <span className="text-2xl text-[#ff7a3d]">→</span>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
            style={{ background: myColor?.hex, color: myColor?.onHex }}
          >
            {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
          </div>
        </div>
        <div className="max-w-[300px] font-display text-2xl font-black leading-[1.25]">
          {t('defend.line', { attacker: attackerName, territory: tDynamic(toTerritoryId, 'territories'), from: tDynamic(fromTerritoryId, 'territories') })}
        </div>

        {result === null && (
          <>
            <div className="font-body text-[15px] text-fg-muted">{t('defend.choose')}</div>
            <div
              className="flex items-center gap-2 rounded-full border px-4 py-[7px] font-body text-sm"
              style={{ color: 'var(--pitch-400)', background: 'color-mix(in srgb, var(--pitch-400) 12%, transparent)', borderColor: 'var(--pitch-400)' }}
            >
              ⏱ {t('defend.noTimer')}
            </div>
          </>
        )}
      </div>

      <div className="flex min-h-[210px] flex-none flex-col justify-end">
        {result === null ? (
          <>
            <div className="flex gap-[11px]">
              <button
                type="button"
                disabled={submitting}
                onClick={() => choose(1)}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 border-border-strong bg-[var(--atlas-t05)] py-[18px] text-fg disabled:opacity-60"
              >
                <span className="font-display text-[30px] font-black">1</span>
                <span className="font-body text-xs">{t('defend.with1')}</span>
              </button>
              <button
                type="button"
                disabled={submitting || forcedToOneDie}
                onClick={() => choose(2)}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 py-[18px] text-fg disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: 'var(--pitch-400)', background: 'rgba(107,162,216,.14)' }}
              >
                <span className="font-display text-[30px] font-black" style={{ color: 'var(--pitch-400)' }}>
                  2
                </span>
                <span className="font-body text-xs">{t('defend.with2')}</span>
              </button>
            </div>
            <div className="mt-[10px] text-center font-body text-[11.5px] text-fg-muted">{t('defend.tip')}</div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4 flex justify-center gap-2.5">
              {result.defenderRolls.map((value, index) => (
                <Dice
                  key={index}
                  value={value as DiceValue}
                  colorHex={myColor?.hex ?? 'var(--surface-3)'}
                  colorOnHex={myColor?.onHex ?? '#fff'}
                  size={58}
                  radius={13}
                  padding={8}
                  gap={3}
                  pipSize={9}
                  boxShadow="0 8px 18px rgba(0,0,0,.5)"
                />
              ))}
            </div>
            <div className="font-display text-xl font-black text-pitch-300">
              {result.conquered
                ? t('defend.result.lost', { defenderLosses: result.defenderLosses })
                : t('defend.result.held', { attackerLosses: result.attackerLosses })}
            </div>
            <div className="mt-1.5 font-body text-[13px] text-fg-muted">{t('detailsOnTv')}</div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-[18px] flex min-h-[60px] w-full items-center justify-center rounded-2xl border border-border-strong bg-[var(--atlas-t05)] font-display text-[17px] font-extrabold text-fg"
            >
              {t('defend.backToWait')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
