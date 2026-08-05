import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dice, type DiceValue } from '../../../components/ui/Dice'
import { ColorSymbol } from '../../../components/ui/ColorSymbol'
import { tvAnimations } from '../../../styles/motion'
import { tDynamic } from '../../../i18n/useT'
import type { TvScreenProps } from './tvScreens'

/**
 * Combat-/eliminatie-overlay ("C9 combat overlay" / "C11 elimination overlay" in het oorspronkelijke design
 * L326-367 en L462-469+). Verplichte eerste stap gelezen: L20-62 (keyframes) en L326-469
 * (markup), plus `motion.ts` (`tvAnimations.attackerDie/defenderDie/resultPop`,
 * `overlayIn`/`combatStageIn`). Rechterspelerpaneel/feed-strip (C12) en de reroll-chip
 * (Generaal-rol, L334-338) blijven buiten scope — zelfde afbakening als `TvMainBoardScreen`
 * resp. het Attack-bouwplan. `t.elimKicker` (L465) heeft geen brontekst in de export (zie
 * `locales/attackTv.ts`) — weggelaten, niet zelf ingevuld. "VEROVERD"-badge toont geen
 * meeverplaats-detail (`moveIn`, L363): daarvoor bestaat geen narratief server-event
 * (`ArmiesMovedAfterConquest` broadcast niets) — bevinding, geen invulruimte.
 *
 * De volgorde resultaat → eliminatie (resultPop vóór atlasSlam) is hier wél JS-gestuurd
 * (2000ms na het narratief-event), omdat het geen CSS-stagger binnen één scherm is maar een
 * wissel tussen twee volledig andere overlay-content-blokken — de uitzondering die het
 * bouwplan daarvoor voorziet.
 */
export function TvCombatOverlay({ state, combat }: TvScreenProps) {
  const { t } = useTranslation('attackTv')
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
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-5"
        style={{ background: 'var(--atlas-overlay)', animation: tvAnimations.overlayIn }}
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
      </div>
    )
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-[26px]"
      style={{ background: 'var(--atlas-overlay)', animation: tvAnimations.overlayIn }}
    >
      <div className="flex flex-col items-center gap-[26px]" style={{ animation: tvAnimations.combatStageIn }}>
        <span className="font-body text-lg font-extrabold uppercase tracking-[.22em] text-silver-400">{t('kicker')}</span>
        <div className="flex items-center gap-11">
          <CombatSide name={attacker?.name} color={attackerColor} label={t('attackerLabel')} dice={combat.attackerRolls} diceAnim={tvAnimations.attackerDie} />
          <span className="font-display text-[44px] font-black text-fg-muted">{t('vs')}</span>
          <CombatSide name={defender?.name} color={defenderColor} label={t('defenderLabel')} dice={combat.defenderRolls} diceAnim={tvAnimations.defenderDie} />
        </div>
        {narrated && (
          <div className="font-display text-h1 font-extrabold">
            {t('resultLine', { defenderLosses: narrated.defenderLosses, attackerLosses: narrated.attackerLosses })}
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
  )
}

interface CombatSideProps {
  name: string | undefined
  color: { hex: string; onHex: string; symbol: string } | null
  label: string
  dice: number[] | null
  diceAnim: (idx: number) => string
}

function CombatSide({ name, color, label, dice, diceAnim }: CombatSideProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex min-h-[136px] flex-col items-center justify-start gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-h3"
            style={{ background: color?.hex, color: color?.onHex }}
          >
            {color?.symbol && <ColorSymbol symbol={color.symbol} />}
          </span>
          <span className="font-display text-[26px] font-extrabold">{name}</span>
        </div>
        <span className="font-body text-body uppercase tracking-[.14em] text-fg-muted">{label}</span>
      </div>
      <div className="flex gap-4">
        {(dice ?? []).map((value, index) => (
          <Dice
            key={index}
            value={value as DiceValue}
            colorHex={color?.hex ?? 'var(--surface-3)'}
            colorOnHex={color?.onHex ?? '#fff'}
            size={96}
            radius={18}
            padding={13}
            gap={5}
            pipSize={16}
            boxShadow="0 16px 34px rgba(0,0,0,.55),inset 0 3px 0 rgba(255,255,255,.25)"
            animation={diceAnim(index)}
          />
        ))}
      </div>
    </div>
  )
}
