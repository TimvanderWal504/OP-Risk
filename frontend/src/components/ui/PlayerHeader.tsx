import { PlayerAvatar } from './PlayerAvatar'

export interface PlayerHeaderAction {
  icon: string
  label: string
  onClick?: () => void
  /** Actief tabblad (bv. het open bottom-sheet-tabblad). */
  active?: boolean
}

export interface PlayerHeaderProps {
  name: string
  colorName: string
  colorHex: string
  colorSymbol?: string | null
  colorOnHex?: string | null
  isHost?: boolean
  /** Beurt-status, bv. "Jouw beurt · Aanvallen". */
  status: string
  /** Reeds geformatteerde beurttimer, bv. "2:41" of "Gepauzeerd". */
  timer: string
  /** 'normal' (default): witte cijfers. 'low': rood, pulserend. 'paused': ❚❚-prefix. */
  timerState?: 'normal' | 'low' | 'paused'
  onSettings?: () => void
  /** Overschrijft de standaard actieknoppen (Mijn kaarten / Mijn missie / Spelinfo). */
  actions?: PlayerHeaderAction[]
}

const DEFAULT_ACTIONS: PlayerHeaderAction[] = [
  { icon: '🃏', label: 'Mijn kaarten' },
  { icon: '🎯', label: 'Mijn missie' },
  { icon: '📊', label: 'Spelinfo' },
]

/** Speler-header op de telefoon: identiteit, beurt-status, beurttimer,
 * instellingen en snelkoppelingen. Presentational — alle waarden komen via
 * props (nu nog placeholders tot het spelbord er is). */
export function PlayerHeader({
  name,
  colorName,
  colorHex,
  colorSymbol,
  colorOnHex,
  isHost = false,
  status,
  timer,
  timerState = 'normal',
  onSettings,
  actions = DEFAULT_ACTIONS,
}: PlayerHeaderProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-[11px] rounded-card border border-border bg-[var(--atlas-t03)] px-3 py-2.5">
        <div className="relative flex-none">
          <PlayerAvatar colorHex={colorHex} colorOnHex={colorOnHex} colorSymbol={colorSymbol} />
          {isHost && (
            <span
              className="absolute -right-[5px] -bottom-[5px] flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-[10px]"
              style={{ border: '2px solid var(--bg)' }}
              aria-label="Host"
            >
              👑
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[19px] font-extrabold">
            {name} <span className="text-[14px] font-bold text-fg-muted">· {colorName}</span>
          </div>
          <div className="mt-[3px] truncate text-[12.5px] text-fg-muted">{status}</div>
        </div>
        <div className="flex-none text-right">
          <div className="font-body text-[9px] font-black tracking-[.14em] text-fg-muted uppercase">Beurttijd</div>
          {timerState === 'normal' && (
            <div className="font-display text-[26px] font-black text-fg tabular-nums">{timer}</div>
          )}
          {timerState === 'low' && (
            <div className="animate-timer-low font-display text-[26px] font-black text-[#ff5257] tabular-nums">
              {timer}
            </div>
          )}
          {timerState === 'paused' && (
            <div className="pt-[5px] font-display text-[15px] font-extrabold text-fg-muted">❚❚ {timer}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onSettings}
          aria-label="Instellingen"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] border border-gold-700 bg-gold-400/10 text-[20px] text-gold-300"
        >
          ⚙
        </button>
      </div>

      <div className="mt-[9px] flex gap-[7px]">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`flex flex-1 flex-col items-center gap-1 rounded-[12px] border px-1 py-2 text-[11px] font-bold ${
              action.active
                ? 'border-gold-600 bg-gold-400/12 text-gold-300'
                : 'border-border bg-[var(--atlas-t03)] text-fg-secondary'
            }`}
          >
            <span className="text-[17px]" aria-hidden>
              {action.icon}
            </span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
