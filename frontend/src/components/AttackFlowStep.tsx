import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PendingCombatDto, PlayerColorDto, TerritoryDto } from '../types/GameState'
import type { PlayerDto } from '../types/Player'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import type { CombatBroadcastState } from '../hooks/useCombatBroadcast'
import { Dice, type DiceValue } from './ui/Dice'
import { ColorSymbol } from './ui/ColorSymbol'
import { phoneAnimations } from '../styles/motion'
import { tDynamic } from '../i18n/useT'

export interface AttackFlowStepProps {
  playerId: string
  myTerritories: TerritoryDto[]
  territories: TerritoryDto[]
  territoryCatalog: TerritoryCatalogDto[]
  players: PlayerDto[]
  colors: PlayerColorDto[]
  myColor: PlayerColorDto | null
  pendingCombat: PendingCombatDto | null
  combat: CombatBroadcastState | null
  onDeclareAttack: (fromTerritoryId: string, toTerritoryId: string, attackDice: number) => Promise<void>
  /** "Ander gevecht" (FO §5.4): stopt de belegering van het huidige doelwit handmatig, zodat de
   *  beurttimer meteen hervat i.p.v. pas bij een volgende `onDeclareAttack`. */
  onAbandonAttack: () => Promise<void>
  onEndPhase: () => Promise<void>
}

type Phase = 'src' | 'tgt' | 'dice' | 'rolled'

/**
 * Aanvallen · kern-flow (`isAttack`-fase in het oorspronkelijke design). Eén doorlopende lokale
 * substaat (`Phase`) i.p.v. losse rollen voor "picker"/"wachtend"/"resultaat" — zelfde opzet
 * als de export zelf (één `isAttack`-sectie met interne substappen `atkPickSrc→atkPickTgt→
 * atkPickDice→atkRolled`, zie het Attack-bouwplan). Legeraantallen worden bij elke render
 * opnieuw uit `myTerritories`/`territories` (props, dus altijd de verse server-state) gelezen —
 * nooit in lokale state gecached — zodat "opnieuw aanvallen" na een verloren worp niet op een
 * gedateerd legeraantal kan vertrouwen.
 */
export function AttackFlowStep({
  playerId,
  myTerritories,
  territories,
  territoryCatalog,
  players,
  colors,
  myColor,
  pendingCombat,
  combat,
  onDeclareAttack,
  onAbandonAttack,
  onEndPhase,
}: AttackFlowStepProps) {
  const { t } = useTranslation('attack')
  const myUnfinishedCombat =
    pendingCombat ??
    (combat?.narrated?.attackerId === playerId && !combat.narrated.conquered
      ? { fromTerritoryId: combat.narrated.fromTerritoryId, toTerritoryId: combat.narrated.toTerritoryId }
      : null)
  // Start meteen op 'rolled' als er al een aangekondigde/net afgehandelde aanval van mij
  // binnenkomt (reconnect/remount middenin of net na een aanval) — anders zou een verse mount
  // de bron-/doelpicker tonen terwijl er allang een aanval loopt of net is opgelost. Een
  // veroverd `narrated`-resultaat telt hier niet mee: die aanval is al volledig afgehandeld via
  // `ConquestMoveStep` (meeverplaatsen) — na afronding daarvan wisselt de rol terug naar
  // 'attacker' en zou deze fallback anders het "nog een keer aanvallen"-scherm van de zojuist
  // veroverde aanval opnieuw tonen i.p.v. de bron-picker voor een nieuwe aanval.
  const [phase, setPhase] = useState<Phase>(() => (myUnfinishedCombat ? 'rolled' : 'src'))
  const [fromTerritoryId, setFromTerritoryId] = useState<string | null>(myUnfinishedCombat?.fromTerritoryId ?? null)
  const [toTerritoryId, setToTerritoryId] = useState<string | null>(myUnfinishedCombat?.toTerritoryId ?? null)
  const [diceN, setDiceN] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const ownerOf = (territoryId: string) => territories.find((t) => t.territoryId === territoryId)?.ownerPlayerId ?? null
  const neighborsOf = (territoryId: string) => territoryCatalog.find((entry) => entry.id === territoryId)?.neighborTerritoryIds ?? []
  const hasEnemyNeighbor = (territoryId: string) =>
    neighborsOf(territoryId).some((neighborId) => {
      const owner = ownerOf(neighborId)
      return owner !== null && owner !== playerId
    })

  const attackableSources = myTerritories.filter((t) => t.armyCount >= 2 && hasEnemyNeighbor(t.territoryId))

  const fromArmyCount = fromTerritoryId ? (myTerritories.find((t) => t.territoryId === fromTerritoryId)?.armyCount ?? 0) : 0
  const maxDice = Math.min(3, fromArmyCount - 1)

  const targets = fromTerritoryId
    ? neighborsOf(fromTerritoryId)
        .filter((neighborId) => {
          const owner = ownerOf(neighborId)
          return owner !== null && owner !== playerId
        })
        .map((territoryId) => {
          const territory = territories.find((t) => t.territoryId === territoryId)!
          const owner = players.find((p) => p.id === territory.ownerPlayerId)
          const ownerColor = colors.find((c) => c.id === owner?.colorId) ?? null

          return { territoryId, armyCount: territory.armyCount, ownerName: owner?.name ?? '', ownerColor }
        })
    : []

  const pickSrc = (territoryId: string) => {
    setFromTerritoryId(territoryId)
    setPhase('tgt')
  }

  const pickTgt = (territoryId: string) => {
    setToTerritoryId(territoryId)
    setDiceN(1)
    setPhase('dice')
  }

  const roll = async () => {
    if (!fromTerritoryId || !toTerritoryId) return

    setSubmitting(true)
    try {
      await onDeclareAttack(fromTerritoryId, toTerritoryId, diceN)
      setPhase('rolled')
    } finally {
      setSubmitting(false)
    }
  }

  const attackAgain = () => {
    setDiceN(1)
    setPhase('dice')
  }

  const otherFight = async () => {
    await onAbandonAttack()
    setFromTerritoryId(null)
    setToTerritoryId(null)
    setPhase('src')
  }

  const stepIndex = phase === 'src' ? 0 : phase === 'tgt' ? 1 : phase === 'dice' ? 2 : 3
  const steps = [t('pickSrc.title'), t('pickTgt.title'), t('pickDice.title'), t('roll')]

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4 pt-0.5">
      <div className="mb-2.5 flex gap-1.5">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <span className={`h-[5px] rounded-[3px] ${index <= stepIndex ? 'bg-silver-400' : 'bg-border-strong'}`} />
            <span className={`text-center font-body text-xs font-bold ${index <= stepIndex ? 'text-silver-300' : 'text-fg-muted'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {phase === 'src' && (
        <>
          <div className="mb-[3px] font-display text-xl font-extrabold">{t('pickSrc.title')}</div>
          <div className="mb-3 font-body text-sm text-fg-muted">{t('pickSrc.subtitle')}</div>
          <div className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto">
            {attackableSources.length === 0 && (
              <div className="font-body text-sm text-fg-muted">{t('pickSrc.empty')}</div>
            )}
            {attackableSources.map((territory) => (
              <button
                key={territory.territoryId}
                type="button"
                onClick={() => pickSrc(territory.territoryId)}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-[var(--atlas-t04)] px-3.5 text-left text-fg"
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-h3"
                  style={{ background: myColor?.hex, color: myColor?.onHex }}
                >
                  {myColor?.symbol && <ColorSymbol symbol={myColor.symbol} />}
                </span>
                <div className="flex-1">
                  <div className="font-display text-h3 font-extrabold">{tDynamic(territory.territoryId, 'territories')}</div>
                  <div className="font-body text-xs text-fg-muted">
                    {territory.armyCount} {t('armiesWord')} ·{' '}
                    {neighborsOf(territory.territoryId).filter((n) => ownerOf(n) !== null && ownerOf(n) !== playerId).length}{' '}
                    {t('targetsWord')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'tgt' && fromTerritoryId && (
        <>
          <div className="mb-[3px] font-display text-xl font-extrabold">{t('pickTgt.title')}</div>
          <div className="mb-3 font-body text-sm text-fg-muted">
            {t('pickTgt.from')} <b className="text-fg">{tDynamic(fromTerritoryId, 'territories')}</b>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto">
            {targets.map((target) => (
              <button
                key={target.territoryId}
                type="button"
                onClick={() => pickTgt(target.territoryId)}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-[var(--atlas-t04)] px-3.5 text-left text-fg"
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-h3"
                  style={{ background: target.ownerColor?.hex, color: target.ownerColor?.onHex }}
                >
                  {target.ownerColor?.symbol && <ColorSymbol symbol={target.ownerColor.symbol} />}
                </span>
                <div className="flex-1">
                  <div className="font-display text-h3 font-extrabold">{tDynamic(target.territoryId, 'territories')}</div>
                  <div className="font-body text-xs text-fg-muted">
                    {target.ownerName} · {target.armyCount} {t('armiesWord')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'dice' && fromTerritoryId && toTerritoryId && (
        <>
          <div className="mb-[3px] font-display text-xl font-extrabold">{t('pickDice.title')}</div>
          <div className="mb-2 font-body text-sm text-fg-muted">
            <b className="text-fg">{tDynamic(fromTerritoryId, 'territories')}</b> → <b className="text-fg">{tDynamic(toTerritoryId, 'territories')}</b>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
            <div className="flex gap-[11px]">
              {[1, 2, 3].map((n) => {
                const disabled = n > maxDice
                const selected = diceN === n && !disabled

                return (
                  <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDiceN(n)}
                    className="flex flex-1 flex-col items-center gap-[7px] rounded-2xl border-2 py-4"
                    style={{
                      borderColor: selected ? 'var(--silver-400)' : 'var(--border)',
                      background: selected ? 'rgba(156,176,202,.14)' : disabled ? 'var(--atlas-t02)' : 'var(--atlas-t04)',
                    }}
                  >
                    <span
                      className="font-display text-h1 font-black"
                      style={{ color: disabled ? 'var(--fg3)' : selected ? 'var(--silver-300)' : 'var(--fg1)' }}
                    >
                      {n}
                    </span>
                    <span className="font-body text-xs" style={{ color: disabled ? 'var(--fg3)' : 'var(--fg2)' }}>
                      {n === 1 ? t('pickDice.diceWord1') : t('pickDice.diceWord2')}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="text-center font-body text-sm text-fg-muted">
              {t('pickDice.hint', { max: maxDice, armies: fromArmyCount, territory: tDynamic(fromTerritoryId, 'territories') })}
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={roll}
            className="flex min-h-[72px] w-full items-center justify-center gap-3 rounded-[18px] border-none bg-pitch-500 font-display text-h1 font-black tracking-[.04em] text-[var(--on-pitch)] shadow-[var(--shadow-glow-pitch)] disabled:opacity-60"
          >
            {t('roll')}
          </button>
          <div className="mt-2 text-center font-body text-xs text-fg-muted">{t('rollIsConfirm')}</div>
        </>
      )}

      {phase === 'rolled' && (
        <AttackRolledResult
          myColor={myColor}
          pendingCombat={pendingCombat}
          combat={combat}
          playerId={playerId}
          territories={territories}
          onAttackAgain={attackAgain}
          onOtherFight={otherFight}
          onEndPhase={onEndPhase}
        />
      )}
    </div>
  )
}

interface AttackRolledResultProps {
  myColor: PlayerColorDto | null
  pendingCombat: PendingCombatDto | null
  combat: CombatBroadcastState | null
  playerId: string
  territories: TerritoryDto[]
  onAttackAgain: () => void
  onOtherFight: () => Promise<void>
  onEndPhase: () => Promise<void>
}

/**
 * `atkRolled` (L604-643). De export toont dobbelstenen + resultaat in één keer (client-only
 * demo, geen server-round-trip); hier verschijnt het resultaat pas zodra `CombatNarrated`
 * binnen is — de tussenliggende wachttoestand (eigen worp al zichtbaar, verdediger nog bezig)
 * is een noodzakelijk gevolg van de echte server-round-trip, geen letterlijke exportsectie.
 * Reroll-blok (L617-635, Generaal-rol) bewust weggelaten — buiten scope, zie het bouwplan.
 */
function AttackRolledResult({
  myColor,
  pendingCombat,
  combat,
  playerId,
  territories,
  onAttackAgain,
  onOtherFight,
  onEndPhase,
}: AttackRolledResultProps) {
  const { t } = useTranslation('attack')
  const attackerRolls = combat?.attackerRolls ?? []
  const narrated = combat?.narrated && combat.narrated.attackerId === playerId ? combat.narrated : null
  const waitingForDefense = pendingCombat !== null && narrated === null
  // Aanvallen vereist minstens 2 legers op het brongebied (1 moet altijd achterblijven) — na
  // verliezen bij deze worp kan dat brongebied nog maar 1 leger over hebben, waarmee "nog een
  // keer aanvallen" vanuit ditzelfde gebied ongeldig is. Actuele legerstand, niet lokaal
  // gecached, om dezelfde reden als `fromArmyCount` in `AttackFlowStep`.
  const canAttackAgain = narrated !== null && (territories.find((t) => t.territoryId === narrated.fromTerritoryId)?.armyCount ?? 0) >= 2

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="font-body text-xs font-extrabold uppercase tracking-[.16em] text-fg-muted">{t('resultShort')}</span>
      <div className="flex gap-2.5">
        {attackerRolls.map((value, index) => (
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
      {waitingForDefense ? (
        <div className="flex items-center gap-2.5 font-body text-sm text-fg-muted">
          <span className="h-[11px] w-[11px] rounded-full bg-fg-muted" style={{ animation: phoneAnimations.waitingDot }} />
        </div>
      ) : (
        narrated && (
          <div className="font-display text-2xl font-black">
            {t('resultLine.lost', { attackerLosses: narrated.attackerLosses, defenderLosses: narrated.defenderLosses })}
          </div>
        )
      )}
      <div className="max-w-[260px] font-body text-sm text-fg-muted">{t('detailsOnTv')}</div>

      {narrated && (
        <div className="flex w-full flex-col gap-[9px]">
          {canAttackAgain && (
            <button
              type="button"
              onClick={onAttackAgain}
              className="flex min-h-15 w-full items-center justify-center gap-2.5 rounded-2xl border-none bg-pitch-500 font-display text-lg font-black text-[var(--on-pitch)] shadow-[var(--shadow-glow-pitch)]"
            >
              {t('attackAgain')}
            </button>
          )}
          <div className="flex gap-[9px]">
            <button
              type="button"
              onClick={onOtherFight}
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-border-strong bg-[var(--atlas-t05)] font-display text-body font-extrabold text-fg"
            >
              {t('otherFight')}
            </button>
            <button
              type="button"
              onClick={onEndPhase}
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border-none bg-pitch-500 font-display text-body font-extrabold text-[var(--on-pitch)]"
            >
              {t('toFortify')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
