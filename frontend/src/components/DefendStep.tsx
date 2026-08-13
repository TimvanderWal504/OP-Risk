import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import type { CombatResultResponse } from '../types/HubResponses'
import { Dice, type DiceValue } from './ui/Dice'
import { ColorSymbol } from './ui/ColorSymbol'
import { ModalShell } from './ui/ModalShell'
import { GlassPanel } from './ui/GlassPanel'
import { noTimerChipTint, defenseDiceBlueTint } from '../styles/glass-tokens'
import { phoneAnimations } from '../styles/motion'
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
  /** "Terug naar wachten": de verdediger heeft zijn eigen worp gezien en klikt 'm zelf weg.
   *  `PhoneAttackScreen` houdt dit component gemount tot dit vuurt (of tot een nieuwe aanval 'm
   *  automatisch vervangt) — zie de doc-comment daar voor waarom dat nodig is. */
  onDismiss: () => void
}

/**
 * "7 DEFEND" (`isDefend`-fase in het oorspronkelijke design). Toont bij de keuzeknoppen bewust geen
 * aanvallerdobbelstenen (de export doet dat ook niet — een verdediger reconnect'end vlak
 * vóór zijn keuze kan gewoon kiezen zonder de gemiste `attack`-broadcast, zie het bouwplan).
 * Het resultaat komt rechtstreeks uit de `ChooseDefenseDice`-invoke-respons, geen
 * `CombatNarrated`-broadcast nodig voor de eigen weergave.
 *
 * Blijft na het resultaat gewoon gemount: `PendingCombat` wordt door de server al leeggemaakt
 * (of van eigenaar gewisseld bij verovering) in dezelfde snapshot als dit resultaat, waardoor de
 * rolbepaling in `PhoneAttackScreen` meteen naar 'bystander' zou omslaan — dit component zelf
 * hoeft daar niets voor te doen, `PhoneAttackScreen` houdt het scherm vast tot `onDismiss`.
 */

/**
 * Kiest de verhalende uitkomstregel vanuit de verdediger (zelfde behandeling als `resultLine()`
 * in `AttackFlowStep.tsx`, 2026-08-13, op verzoek — de vorige tekst noemde alleen de
 * aanvaller-verliezen en was daarmee feitelijk nog de aanvallerskant van het verhaal). Vier
 * uitkomsten i.p.v. drie: verovering krijgt een eigen regel, want "je verliest N legers" alleen
 * verdoezelt dat het hele gebied weg is — de andere drie zijn wiskundig uitputtend zolang het
 * gebied overeind blijft (zie de toelichting bij `resultLine.both`: een gemengde uitslag is
 * altijd 1-om-1, en kan dus nooit samenvallen met een volledige verovering).
 */
function resultKey(attackerLosses: number, defenderLosses: number, conquered: boolean) {
  if (conquered) return ['defend.result.conquered'] as const
  if (attackerLosses > 0 && defenderLosses > 0) return ['defend.result.both'] as const
  if (attackerLosses > 0) return ['defend.result.won', { count: attackerLosses }] as const

  return ['defend.result.lost', { count: defenderLosses }] as const
}

export function DefendStep({
  attackerName,
  attackerColor,
  myColor,
  fromTerritoryId,
  toTerritoryId,
  defenderArmyCount,
  onChooseDefenseDice,
  onDismiss,
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
    <ModalShell
      context="phone"
      animated
      // Geen `PhoneScreen`: dit is een full-screen overlay (`absolute inset-0`) en geen
      // scherm binnen de kolom van `PhoneShell`. Zijkanten en onderkant volgen wél
      // dezelfde `--spacing-gutter` als elk ander telefoonscherm; `pt-[52px]` is
      // bestaande bovenclearance en bleef buiten de frame-gelijktrekking (2026-08-13).
      className="absolute inset-0 z-[60] flex flex-col px-gutter pt-[52px] pb-gutter"
      style={{ borderRadius: 0 }}
    >
      {/* BEVINDING, opgelost (2026-08-13, gebruiker gescreenshot): de hele kop stond kaal op de
          stage-illustratie. `ModalShell` is "clear glass" (blur, geen tint), dus vervaagt de
          illustratie wel maar verdonkert 'm niet — en dit blok valt precies in de ademband waar
          `stageScrim` bewust geen randalpha zet. Eén gedeeld paneel eromheen, zelfde idioom als
          `TvPlaceholderScreen`/`OrderRollWaitStep`; de nesting-guard laat de blur eraf (No-Nested-
          Blur Rule), rand + schaduw blijven. De contrastvloer komt van de on-glass tekstbehandeling,
          die alleen `.text-fg*` herkent — vandaar dat de losse inline-kleuren hieronder eruit zijn. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <GlassPanel elevation="raised" context="phone" className="flex flex-col items-center gap-3.5 text-center">
          <span
            className="font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-live"
            style={{ textShadow: 'var(--glass-text-shadow)' }}
          >
            {t('defend.underAttack')}
          </span>
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
              style={{ background: attackerColor?.hex, color: attackerColor?.onHex }}
            >
              {attackerColor?.symbol && <ColorSymbol symbol={attackerColor.symbol} />}
            </div>
            <span className="text-2xl text-fg-secondary">→</span>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
              style={{ background: myColor?.hex, color: myColor?.onHex }}
            >
              {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
            </div>
          </div>
          <div className="max-w-[300px] font-display text-2xl font-black leading-[1.25] text-fg">
            {t('defend.line', { attacker: attackerName, territory: tDynamic(toTerritoryId, 'territories'), from: tDynamic(fromTerritoryId, 'territories') })}
          </div>

          {result === null && (
            <>
              <div className="font-body text-[15px] text-fg-secondary">{t('defend.choose')}</div>
              {/* Kleuridentiteit van de chip zit in tint + rand, niet in de tekst: `var(--pitch-400)`
                  als tekstkleur omzeilt de on-glass behandeling (zelfde bugklasse als de
                  dobbelsteen-picker van AttackFlowStep, 2026-08-11). */}
              <div
                className="flex items-center gap-2 rounded-full border px-4 py-[7px] font-body text-sm text-fg-muted"
                style={{ background: noTimerChipTint, borderColor: 'var(--pitch-400)' }}
              >
                {t('defend.noTimer')}
              </div>
            </>
          )}
        </GlassPanel>
      </div>

      <div className="flex min-h-[210px] flex-none flex-col justify-end">
        {result === null ? (
          /* Keuzeblok als één paneel — dezelfde structuur als de dobbelsteen-picker van
             AttackFlowStep: de twee kaarten houden hun eigen rand (die draagt de keuze), maar
             delen één surface met de hint eronder i.p.v. los op de illustratie te staan. */
          <GlassPanel elevation="base" context="phone">
            <div className="flex gap-[11px]">
              <button
                type="button"
                disabled={submitting}
                onClick={() => choose(1)}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 py-[18px] text-fg disabled:opacity-60"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                <span className="font-display text-[30px] font-black">1</span>
                <span className="font-body text-xs">{t('defend.with1')}</span>
              </button>
              <button
                type="button"
                disabled={submitting || forcedToOneDie}
                onClick={() => choose(2)}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 py-[18px] text-fg disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: 'var(--pitch-400)', background: defenseDiceBlueTint }}
              >
                <span className="font-display text-[30px] font-black" style={{ color: 'var(--pitch-400)' }}>
                  2
                </span>
                <span className="font-body text-xs">{t('defend.with2')}</span>
              </button>
            </div>
            <div className="mt-[10px] text-center font-body text-[11.5px] text-fg-muted">{t('defend.tip')}</div>
          </GlassPanel>
        ) : (
          <div className="text-center">
            {/* Worp + uitkomst delen één paneel, zelfde reden als het keuzeblok hierboven. */}
            <GlassPanel elevation="base" context="phone">
              {/* Zelfde `combatDie`-tumble als de aanvallerdobbelstenen in AttackFlowStep — het
                  token in motion.ts dekt expliciet beide ("aanval/verdedig-dobbelstenen"). */}
              <div className="mb-4 flex justify-center gap-2.5">
                {result.defenderRolls.map((value, index) => (
                  <Dice
                    key={index}
                    value={value as DiceValue}
                    colorHex={myColor?.hex ?? 'var(--surface-3)'}
                    context="phone"
                    size={58}
                    radius={13}
                    padding={8}
                    gap={3}
                    pipSize={9}
                    animation={phoneAnimations.combatDie(index)}
                  />
                ))}
              </div>
              <div className="font-display text-xl font-black text-pitch-300" style={{ textShadow: 'var(--glass-text-shadow)' }}>
                {t(...resultKey(result.attackerLosses, result.defenderLosses, result.conquered))}
              </div>
              <div className="mt-1.5 font-body text-[13px] text-fg-muted">{t('detailsOnTv')}</div>
            </GlassPanel>
            {/* Genest in ModalShell (al een GlassPanel), dus de nesting-guard schakelt de blur hier
                automatisch uit — rand en schaduw blijven over (No-Nested-Blur Rule). */}
            <GlassPanel
              elevation="raised"
              context="phone"
              padding="none"
              className="mt-[18px] w-full rounded-2xl"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <button
                type="button"
                onClick={onDismiss}
                className="flex min-h-[60px] w-full items-center justify-center font-display text-[17px] font-extrabold text-fg"
              >
                {t('defend.backToWait')}
              </button>
            </GlassPanel>
          </div>
        )}
      </div>
    </ModalShell>
  )
}
