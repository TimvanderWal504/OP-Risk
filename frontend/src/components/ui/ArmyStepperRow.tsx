import type { PlayerColorDto } from '../../types/GameState'
import { ColorAvatar } from './ColorAvatar'

export interface ArmyStepperRowProps {
  color: PlayerColorDto | null
  label: string
  /**
   * `true`: alleen een +-knop, onomkeerbaar — matcht Startopstelling-plaatsen
   * (`setupAddBg`/`setupCursor` in het oorspronkelijke design). `false`: volwaardige
   * +/− stepper — matcht Versterken (L528-536). De twee fases hebben bewust verschillend
   * gedrag in het design (FO §5.1: setup is 1-richting, Versterken mag je bijstellen vóór
   * bevestigen); deze vlag houdt één component bruikbaar voor beide zonder het design van de
   * ene fase in de andere te lekken.
   */
  incrementOnly: boolean
  /** Setup: huidig aantal legers op dit gebied. Versterken: het totaal ná de pending delta (`r.total`). */
  armyCount: number
  /** Alleen bij `incrementOnly=false`: het aantal vóór de pending delta (`r.base`). */
  baseArmyCount?: number
  /** Alleen bij `incrementOnly=false`: de pending delta zelf (`r.add`). */
  delta?: number
  canIncrement: boolean
  canDecrement?: boolean
  onIncrement: () => void
  onDecrement?: () => void
}

/** Herbruikbare per-gebied legerrij, gedeeld tussen Startopstelling-plaatsen en (later)
 * Versterken — zie `incrementOnly` doc voor welk design-fragment welke variant matcht. */
export function ArmyStepperRow({
  color,
  label,
  incrementOnly,
  armyCount,
  baseArmyCount,
  delta,
  canIncrement,
  canDecrement = false,
  onIncrement,
  onDecrement,
}: ArmyStepperRowProps) {
  if (incrementOnly) {
    return (
      <div className="flex items-center gap-3 rounded-[14px] border border-border bg-[var(--atlas-t04)] px-3 py-[9px]">
        <ColorAvatar color={color} variant="row" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-[16px] font-extrabold">{label}</div>
        </div>
        <span className="min-w-[30px] text-right font-display text-[22px] font-black tabular-nums">
          {armyCount}
        </span>
        <button
          type="button"
          disabled={!canIncrement}
          onClick={onIncrement}
          className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl font-display text-2xl font-black text-[var(--on-pitch)] disabled:cursor-not-allowed"
          style={{ background: canIncrement ? 'var(--pitch-500)' : 'var(--border-strong)' }}
        >
          {'+'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-[10px] rounded-[14px] border border-border bg-[var(--atlas-t04)] px-[10px] py-2">
      <ColorAvatar color={color} variant="reinforce" />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[15px] font-extrabold">{label}</div>
        <div className="text-[11.5px] text-fg-muted">
          {baseArmyCount} {'→'} <b className="text-pitch-300">{armyCount}</b>
        </div>
      </div>
      <button
        type="button"
        disabled={!canDecrement}
        onClick={onDecrement}
        className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] border border-border-strong bg-[var(--atlas-t05)] font-black text-xl text-fg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {'−'}
      </button>
      <span className="min-w-6 text-center font-display text-xl font-black">{delta}</span>
      <button
        type="button"
        disabled={!canIncrement}
        onClick={onIncrement}
        className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] font-black text-xl text-[var(--on-pitch)] disabled:cursor-not-allowed"
        style={{ background: canIncrement ? 'var(--pitch-500)' : 'var(--border-strong)' }}
      >
        {'+'}
      </button>
    </div>
  )
}
