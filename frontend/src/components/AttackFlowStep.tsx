import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PendingCombatDto, PlayerColorDto, TerritoryDto } from '../types/GameState'
import type { PlayerDto } from '../types/Player'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import type { CombatBroadcastState } from '../hooks/useCombatBroadcast'
import { Dice, type DiceValue } from './ui/Dice'
import { ColorSymbol } from './ui/ColorSymbol'
import { GlassPanel } from './ui/GlassPanel'
import { Button } from './ui/Button'
import { Footer } from './ui/Footer'
import { phoneAnimations } from '../styles/motion'
import { selectedSilverBg } from '../styles/glass-tokens'
import { tDynamic } from '../i18n/useT'
import { PhoneScreen } from './ui/PhoneScreen'

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
 * Aanvallen · kern-flow. Eén lokale substaat (`Phase`) i.p.v. losse rollen voor
 * "picker"/"wachtend"/"resultaat". Legeraantallen worden bij elke render vers uit
 * `myTerritories`/`territories` (props, dus altijd de actuele server-state) gelezen — nooit
 * lokaal gecached — zodat "opnieuw aanvallen" na een verloren worp niet op een gedateerd
 * legeraantal kan vertrouwen.
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
  // Start op 'rolled' als er al een aangekondigde/net afgehandelde aanval van mij binnenkomt
  // (reconnect/remount tijdens of vlak na een aanval) — anders toont een verse mount de
  // bron-/doelpicker terwijl er al een aanval loopt. Een veroverd `narrated`-resultaat telt niet
  // mee: die aanval is al afgehandeld via `ConquestMoveStep`, en na afronding wisselt de rol
  // terug naar 'attacker' — zonder deze uitzondering zou het net veroverde "aanval"-scherm
  // opnieuw verschijnen i.p.v. de bron-picker voor een nieuwe aanval.
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

  // Terugstappen binnen de picker. Puur lokaal: tot `roll()` is er nog geen `DeclareAttack` naar
  // de server gegaan, dus er valt niets af te breken (anders dan bij `otherFight` hieronder, dat
  // een al aangekondigd gevecht opgeeft en daarom wél `onAbandonAttack` nodig heeft). De keuze
  // die je loslaat wordt gewist, zodat een half ingevulde selectie niet blijft hangen.
  const backToSrc = () => {
    setFromTerritoryId(null)
    setToTerritoryId(null)
    setPhase('src')
  }

  const backToTgt = () => {
    setToTerritoryId(null)
    setPhase('tgt')
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
    <PhoneScreen>
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
          <GlassPanel elevation="base" context="phone" padding="none" className="mb-3 inline-block self-start rounded-2xl px-4 py-2">
            <div className="font-display text-xl font-extrabold">{t('pickSrc.title')}</div>
            <div className="font-body text-sm text-fg-muted">{t('pickSrc.subtitle')}</div>
          </GlassPanel>
          <div className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto">
            {attackableSources.length === 0 && (
              <div className="font-body text-sm text-fg-muted">{t('pickSrc.empty')}</div>
            )}
            {attackableSources.map((territory) => (
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
                    {/* `text-sm` (secundair/labels) i.p.v. `text-xs` (meta/badge-tekst): dit is de
                        enige inhoudelijke data van de rij — legers en doelen — waarop de keuze
                        gebaseerd wordt, geen meta-label. Zelfde trede als de subtitel erboven. */}
                    <div className="font-body text-sm text-fg-muted">
                      {territory.armyCount} {t('armiesWord')} ·{' '}
                      {neighborsOf(territory.territoryId).filter((n) => ownerOf(n) !== null && ownerOf(n) !== playerId).length}{' '}
                      {t('targetsWord')}
                    </div>
                  </div>
                </button>
              </GlassPanel>
            ))}
          </div>
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
            {targets.map((target) => (
              <GlassPanel key={target.territoryId} elevation="base" context="phone" padding="none" className="rounded-2xl">
                <button
                  type="button"
                  onClick={() => pickTgt(target.territoryId)}
                  className="flex min-h-16 w-full items-center gap-3 px-3.5 text-left text-fg"
                >
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-h3"
                    style={{ background: target.ownerColor?.hex, color: target.ownerColor?.onHex }}
                  >
                    {target.ownerColor?.symbol && <ColorSymbol symbol={target.ownerColor.symbol} />}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-h3 font-extrabold">{tDynamic(target.territoryId, 'territories')}</div>
                    {/* Zelfde trede als de bronlijst hierboven: rij-data, geen meta-label. */}
                    <div className="font-body text-sm text-fg-muted">
                      {target.ownerName} · {target.armyCount} {t('armiesWord')}
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

      {phase === 'dice' && fromTerritoryId && toTerritoryId && (
        <>
          <GlassPanel elevation="base" context="phone" padding="none" className="mb-2 inline-block self-start rounded-2xl px-4 py-2">
            <div className="font-display text-xl font-extrabold">{t('pickDice.title')}</div>
            <div className="font-body text-sm text-fg-muted">
              <b className="text-fg">{tDynamic(fromTerritoryId, 'territories')}</b> → <b className="text-fg">{tDynamic(toTerritoryId, 'territories')}</b>
            </div>
          </GlassPanel>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
            {/* Eén gedeeld glaspaneel om de hele picker (kaarten + hint) i.p.v. elke kaart een
                eigen backdrop-filter: drie los geblurde panelen naast elkaar oogden niet als één
                samenhangende keuzeset. Genest schakelt de nesting-guard hun eigen blur uit
                (zelfde mechanisme als DefendStep in ModalShell) — nog altijd losse kaarten qua
                rand/tint, op één gedeelde achtergrond. */}
            <GlassPanel elevation="base" context="phone" className="rounded-2xl">
              <div className="flex gap-[11px]">
                {[1, 2, 3].map((n) => {
                  const disabled = n > maxDice
                  const selected = diceN === n && !disabled

                  return (
                    // 'selected' blijft de dekkende `selectedSilverBg` als inline override.
                    <GlassPanel
                      key={n}
                      elevation={disabled ? 'raised' : 'base'}
                      context="phone"
                      padding="none"
                      className="flex-1 rounded-2xl"
                      style={{
                        borderWidth: 2,
                        borderColor: selected ? 'var(--silver-400)' : 'var(--border)',
                        background: selected ? selectedSilverBg : undefined,
                      }}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setDiceN(n)}
                        className="flex w-full flex-col items-center gap-[7px] py-4"
                      >
                        <span
                          className={`font-display text-h1 font-black ${disabled ? 'text-fg-muted' : 'text-fg'}`}
                          style={selected ? { color: 'var(--silver-300)' } : undefined}
                        >
                          {n}
                        </span>
                        <span className={`font-body text-xs ${disabled ? 'text-fg-muted' : 'text-fg-secondary'}`}>
                          {n === 1 ? t('pickDice.diceWord1') : t('pickDice.diceWord2')}
                        </span>
                      </button>
                    </GlassPanel>
                  )
                })}
              </div>
              <div className="mt-3 text-center font-body text-sm text-fg-muted">
                {t('pickDice.hint', { max: maxDice, armies: fromArmyCount, territory: tDynamic(fromTerritoryId, 'territories') })}
              </div>
            </GlassPanel>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={roll}
            className="flex min-h-[72px] w-full items-center justify-center gap-3 rounded-[18px] border-none bg-pitch-500 font-display text-h1 font-black tracking-[.04em] text-[var(--on-pitch)] shadow-[var(--shadow-glow-pitch)] disabled:opacity-60"
          >
            {t('roll')}
          </button>
          {/* Zelfde ontsnapping als op de doelwitstap: ook hier is nog niets naar de server. */}
          <Button variant="secondary" onClick={backToTgt} className="mt-2.5 min-h-[46px] text-sm">
            {t('pickDice.back')}
          </Button>
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
    </PhoneScreen>
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
 * Verhalende uitkomstregel bij twee servergetallen. Puur presentatie: er wordt niets
 * herberekend, alleen benoemd wat de server al beslist heeft. Beide kanten verliezen iets →
 * altijd 1-om-1.
 */
function resultLine(attackerLosses: number, defenderLosses: number) {
  if (attackerLosses > 0 && defenderLosses > 0) return ['resultLine.both'] as const
  if (attackerLosses > 0) return ['resultLine.lost', { count: attackerLosses }] as const

  return ['resultLine.won', { count: defenderLosses }] as const
}

/**
 * Toont het resultaat pas zodra `CombatNarrated` binnen is; de tussenliggende wachttoestand
 * (eigen worp al zichtbaar, verdediger nog bezig) is een gevolg van de echte server-round-trip.
 * Reroll-blok (Generaal-rol) bewust weggelaten — buiten scope, zie het Attack-bouwplan.
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
  // verliezen kan het brongebied nog maar 1 leger over hebben, waarmee "nog een keer aanvallen"
  // ongeldig wordt. Actuele legerstand, niet lokaal gecached — zelfde reden als `fromArmyCount`.
  const canAttackAgain = narrated !== null && (territories.find((t) => t.territoryId === narrated.fromTerritoryId)?.armyCount ?? 0) >= 2

  return (
    <div className="flex flex-1 flex-col text-center">
      {/* De uitkomst blijft gecentreerd in de vrije ruimte; de acties zakken naar de onderbalk.
          `flex-1` op deze wikkel i.p.v. `my-auto` op het paneel: `Footer` duwt zichzelf al met
          `mt-auto` omlaag, en twee concurrerende auto-marges zouden de ruimte in drieën delen
          i.p.v. het paneel te centreren. */}
      <div className="flex flex-1 items-center justify-center">
        <GlassPanel elevation="base" context="phone" padding="none" className="flex flex-col items-center gap-4 rounded-2xl px-5 py-4">
          <span className="font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted">{t('resultShort')}</span>
          {/* Zelfde `phDice`-tumble als de order-roll (`combatDie` in motion.ts), korter (.8s) en
              per dobbelsteen 0,12s gestaggerd. Draait pas zodra de server de worp heeft
              geleverd (`attackerRolls`), dus de animatie loopt niet op de uitkomst vooruit. */}
          <div className="flex gap-2.5">
            {attackerRolls.map((value, index) => (
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
          {waitingForDefense ? (
            <div className="flex items-center gap-2.5 font-body text-sm text-fg-muted">
              <span className="h-[11px] w-[11px] rounded-full bg-fg-muted" style={{ animation: phoneAnimations.waitingDot }} />
            </div>
          ) : (
            narrated && (
              <div className="font-display text-2xl font-black">
                {t(...resultLine(narrated.attackerLosses, narrated.defenderLosses))}
              </div>
            )
          )}
          <div className="max-w-[260px] font-body text-sm text-fg-muted">{t('detailsOnTv')}</div>
        </GlassPanel>
      </div>

      {narrated && (
        <Footer>
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
            {/* `Button variant="secondary"` zet dezelfde surface al op het knop-element zelf —
                geen handgebouwde `GlassPanel` omheen nodig (extra DOM-laag die DESIGN.md
                § Components/Buttons afraadt). */}
            <Button variant="secondary" onClick={onOtherFight} className="min-h-14 flex-1 text-body">
              {t('otherFight')}
            </Button>
            {/* `font-black` i.p.v. `font-extrabold`: gelijk aan de `Button` ernaast, die zijn
                gewicht uit het component haalt en zich niet per class laat overschrijven. */}
            <button
              type="button"
              onClick={onEndPhase}
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border-none bg-pitch-500 font-display text-body font-black text-[var(--on-pitch)]"
            >
              {t('toFortify')}
            </button>
          </div>
        </Footer>
      )}
    </div>
  )
}
