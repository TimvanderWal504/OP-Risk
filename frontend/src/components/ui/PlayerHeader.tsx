import { PlayerAvatar } from './PlayerAvatar'

export interface PlayerHeaderAction {
  icon: string
  label: string
  onClick?: () => void
}

export interface PlayerHeaderProps {
  name: string
  colorName: string
  colorHex: string
  /** Beurt-status, bv. "Jouw beurt · Aanvallen". */
  status: string
  /** Reeds geformatteerde beurttimer, bv. "2:41". */
  timer: string
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
  status,
  timer,
  onSettings,
  actions = DEFAULT_ACTIONS,
}: PlayerHeaderProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 rounded-card border border-border bg-white/3 px-3.5 py-3">
        <PlayerAvatar colorHex={colorHex} isHost={false} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-h3 font-black">
            {name} <span style={{ color: colorHex }}>· {colorName}</span>
          </div>
          <div className="truncate text-[13px] text-fg-muted">{status}</div>
        </div>
        <div className="text-right">
          <div className="twc-eyebrow text-fg-muted">Beurttijd</div>
          <div className="font-display text-h2 font-black tabular-nums">{timer}</div>
        </div>
        <button
          type="button"
          onClick={onSettings}
          aria-label="Instellingen"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-input bg-gold-400 text-[20px] text-[#0a0e17]"
        >
          ⚙
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="flex flex-col items-center gap-1 rounded-card border border-border bg-white/3 py-3 text-xs font-bold text-fg"
          >
            <span className="text-lg" aria-hidden>
              {action.icon}
            </span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
