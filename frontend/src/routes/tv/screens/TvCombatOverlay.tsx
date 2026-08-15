import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dice, type DiceValue } from '../../../components/ui/Dice'
import { ColorSymbol } from '../../../components/ui/ColorSymbol'
import { ModalShell } from '../../../components/ui/ModalShell'
import { tvAnimations } from '../../../styles/motion'
import { tDynamic } from '../../../i18n/useT'
import type { TvScreenProps } from './tvScreens'

/**
 * Combat-/eliminatie-overlay. `motion.ts` levert `tvAnimations.attackerDie/defenderDie/
 * resultPop`, `overlayIn`/`combatStageIn`. Rechterspelerpaneel/feed-strip en de reroll-chip
 * (Generaal-rol) blijven buiten scope — zelfde afbakening als `TvMainBoardScreen` resp. het
 * Attack-bouwplan. `t.elimKicker` heeft geen brontekst (zie `locales/attackTv.ts`) — weggelaten,
 * niet zelf ingevuld. "VEROVERD"-badge toont geen meeverplaats-detail: daarvoor bestaat geen
 * narratief server-event (`ArmiesMovedAfterConquest` broadcast niets) — bevinding, geen
 * invulruimte.
 *
 * De volgorde resultaat → eliminatie (resultPop vóór atlasSlam) is hier wél JS-gestuurd
 * (2000ms na het narratief-event), omdat het geen CSS-stagger binnen één scherm is maar een
 * wissel tussen twee volledig andere overlay-content-blokken — de uitzondering die het
 * bouwplan daarvoor voorziet.
 */
export function TvCombatOverlay({ state, combat }: TvScreenProps) {
  const { t } = useTranslation('attackTv')

  /**
   * Kiest de verhalende uitkomstregel, altijd vanuit de aanvallende kleur. Sluit over `t` i.p.v.
   * een tuple terug te geven zoals `resultLine()` in `AttackFlowStep.tsx`: de "both"-tak heeft
   * hier een ander optiesvorm (`attacker`+`defender` i.p.v. `count`), waardoor de teruggegeven
   * tuple-union niet meer op één i18next-overload paste (TS2345) — een directe `t(...)`-aanroep
   * per tak omzeilt dat.
   */
  function resultLine(attackerName: string, defenderName: string, attackerLosses: number, defenderLosses: number) {
    if (attackerLosses > 0 && defenderLosses > 0) return t('resultLine.both', { attacker: attackerName, defender: defenderName })
    if (attackerLosses > 0) return t('resultLine.lost', { attacker: attackerName, count: attackerLosses })

    return t('resultLine.won', { attacker: attackerName, count: defenderLosses })
  }
  const [showElimination, setShowElimination] = useState(false)
  // Bijgehouden om de reset op een nieuw gevecht tijdens render te doen (adjusting-state-
  // during-render, zelfde patroon als `useHeldCombat.ts`) i.p.v. synchroon in een effect —
  // dat laatste triggert react-hooks/set-state-in-effect zonder dat het hier "async" hoeft
  // te zijn: het is afgeleide state, geen bijwerking.
  const [trackedCorrelationId, setTrackedCorrelationId] = useState<string | null>(null)

  const narrated = combat?.narrated ?? null
  const eliminatedPlayerId = narrated?.eliminatedPlayerId ?? null

  if ((combat?.correlationId ?? null) !== trackedCorrelationId) {
    setTrackedCorrelationId(combat?.correlationId ?? null)
    if (showElimination) setShowElimination(false)
  }

  useEffect(() => {
    if (!eliminatedPlayerId) return

    const timeout = setTimeout(() => setShowElimination(true), 2000)

    return () => clearTimeout(timeout)
  }, [combat?.correlationId, eliminatedPlayerId])

  // `resolveTvOverlay` mount dit component alleen als `combat` al niet-null is; deze guard is
  // puur voor de typechecker (TvScreenProps.combat is breder dan wat dit scherm nodig heeft).
  if (!combat) return null

  const pendingCombat = state.turnState?.pendingCombat ?? null
  const attackerId = narrated?.attackerId ?? state.turnState?.activePlayerId ?? null
  const defenderId =
    narrated?.defenderId ??
    (pendingCombat ? (state.territories.find((territory) => territory.territoryId === pendingCombat.toTerritoryId)?.ownerPlayerId ?? null) : null)

  const attacker = state.players.find((player) => player.id === attackerId)
  const defender = state.players.find((player) => player.id === defenderId)
  const attackerColor = state.colors.find((color) => color.id === attacker?.colorId) ?? null
  const defenderColor = state.colors.find((color) => color.id === defender?.colorId) ?? null

  if (showElimination && eliminatedPlayerId) {
    const eliminated = state.players.find((player) => player.id === eliminatedPlayerId)
    const eliminatedColor = state.colors.find((color) => color.id === eliminated?.colorId) ?? null
    const eliminatedBy = state.players.find((player) => player.id === narrated?.attackerId)

    return (
      <ModalShell
        context="tv"
        animated
        className="absolute inset-0 flex flex-col items-center justify-center gap-5"
        style={{ borderRadius: 0, animation: tvAnimations.overlayIn }}
      >
        <div className="flex items-center gap-[26px]" style={{ animation: tvAnimations.titleSlamShort }}>
          <div
            className="flex h-[120px] w-[120px] items-center justify-center rounded-[26px] text-[64px] opacity-85"
            style={{ background: eliminatedColor?.hex, color: eliminatedColor?.onHex }}
          >
            {eliminatedColor?.symbol && <ColorSymbol symbol={eliminatedColor.symbol} />}
          </div>
          <h1 className="m-0 font-display text-[88px] font-black tracking-[-.01em] text-white">
            {t('eliminatedHeadline', { name: eliminated?.name ?? '' })}
          </h1>
        </div>
        {eliminatedBy && (
          <div className="font-body text-lg text-fg-muted">{t('eliminatedBy', { name: eliminatedBy.name })}</div>
        )}
      </ModalShell>
    )
  }

  return (
    <ModalShell context="tv" animated className="absolute inset-0 grid" style={{ borderRadius: 0, animation: tvAnimations.overlayIn }}>
      {/* Drie banden: kicker (onderaan band 1), gevecht (band 2), uitkomst (bovenaan band 3).
          De 1fr-banden erboven en eronder zijn even hoog, dus het gevechtsblok staat op de exacte
          verticale middenlijn en blijft daar staan wanneer de uitkomst ~later binnenkomt — geen
          herposition van de dobbelstenen op het moment dat het resultaat verschijnt. */}
      <div
        className="grid grid-rows-[1fr_auto_1fr] justify-items-center gap-y-[26px] p-6 px-6.5"
        style={{ animation: tvAnimations.combatStageIn }}
      >
        <span className="self-end font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-silver-400">
          {t('kicker')}
        </span>

        {/* Eén gedeeld raster voor beide zijden: naam-, label- en dobbelsteenrij zijn dezelfde
            grid-rijen links en rechts, dus ze liggen per definitie op één lijn — ongeacht hoeveel
            dobbelstenen een zijde toont of dat er nog geen zijn. */}
        <div
          className="grid items-center justify-items-center gap-x-11 gap-y-4"
          style={{
            gridTemplateColumns: `${SIDE_COLUMN_PX}px auto ${SIDE_COLUMN_PX}px`,
            gridTemplateRows: `auto auto ${TV_DIE_SIZE}px`,
          }}
        >
          <CombatSide side="attacker" name={attacker?.name} color={attackerColor} label={t('attackerLabel')} dice={combat.attackerRolls} />
          <span className="col-start-2 row-span-3 row-start-1 font-display text-[44px] font-black text-fg-muted">{t('vs')}</span>
          <CombatSide side="defender" name={defender?.name} color={defenderColor} label={t('defenderLabel')} dice={combat.defenderRolls} />
        </div>

        <div className="flex flex-col items-center gap-4 self-start">
          {narrated && (
            <div className="font-display text-h1 font-extrabold">
              {resultLine(attackerColor?.name ?? '', defenderColor?.name ?? '', narrated.attackerLosses, narrated.defenderLosses)}
            </div>
          )}
          {narrated?.conquered && (
            <div
              className="flex items-center gap-4 rounded-[14px] border px-[26px] py-3.5"
              style={{ background: 'color-mix(in srgb, var(--pitch-400) 16%, transparent)', borderColor: 'var(--pitch-600)', animation: tvAnimations.resultPop }}
            >
              <span className="font-display text-[30px] font-black tracking-[.08em]" style={{ color: 'var(--pitch-600)' }}>
                {t('captured')}
              </span>
              <span className="font-body text-xl text-fg">{tDynamic(narrated.toTerritoryId, 'territories')}</span>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  )
}

/** TV-dobbelsteengeometrie, zoals hieronder aan `Dice` doorgegeven. */
const TV_DIE_SIZE = 96
/** Tussenruimte in de dobbelsteenrij — `gap-4`, gelijk aan de rij-gap van het gevechtsraster. */
const TV_DIE_GAP = 16
/**
 * Vaste kolombreedte per zijde: de breedste worp die een zijde kan tonen (drie dobbelstenen).
 * Beide zijden krijgen dezelfde reservering, zodat `VS` op de middenlijn blijft en er niets
 * horizontaal verspringt wanneer de verdedigerworp binnenkomt — die start bewust een halve
 * seconde later dan de aanvallerworp (`tvAnimations.defenderDie`).
 */
const SIDE_COLUMN_PX = TV_DIE_SIZE * 3 + TV_DIE_GAP * 2

/** Kolom + inkomstrichting per zijde; de rijen zijn gedeeld met de andere zijde. */
const SIDE_LAYOUT = {
  attacker: { column: 'col-start-1', die: tvAnimations.attackerDie },
  defender: { column: 'col-start-3', die: tvAnimations.defenderDie },
} as const

interface CombatSideProps {
  side: keyof typeof SIDE_LAYOUT
  name: string | undefined
  color: { hex: string; onHex: string; symbol: string } | null
  label: string
  dice: number[] | null
}

/**
 * De drie cellen van één zijde. Geen eigen wrapper-element: de cellen zijn directe kinderen van
 * het gedeelde gevechtsraster, anders zouden links en rechts elk hun eigen rijhoogtes krijgen.
 */
function CombatSide({ side, name, color, label, dice }: CombatSideProps) {
  const { column, die } = SIDE_LAYOUT[side]

  return (
    <>
      <div className={`${column} row-start-1 flex items-center gap-2.5`}>
        <span
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-h3"
          style={{ background: color?.hex, color: color?.onHex }}
        >
          {color?.symbol && <ColorSymbol symbol={color.symbol} />}
        </span>
        <span className="font-display text-[26px] font-extrabold">{name}</span>
      </div>
      <span className={`${column} row-start-2 font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted`}>
        {label}
      </span>
      <div className={`${column} row-start-3 flex items-center gap-4`}>
        {(dice ?? []).map((value, index) => (
          <Dice
            key={index}
            value={value as DiceValue}
            colorHex={color?.hex ?? 'var(--surface-3)'}
            context="tv"
            size={TV_DIE_SIZE}
            radius={18}
            padding={13}
            gap={5}
            pipSize={16}
            animation={die(index)}
          />
        ))}
      </div>
    </>
  )
}
