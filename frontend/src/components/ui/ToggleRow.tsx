import { Switch } from './Switch'

export interface ToggleRowProps {
  label: string
  sub: string
  icon?: string
  on: boolean
  onToggle: () => void
  disabled?: boolean
  /** Toont een "binnenkort"-badge naast het label. */
  soon?: boolean
}

/** Rij met icoon, label + subtekst en een {@link Switch} aan de rechterkant. */
export function ToggleRow({
  icon,
  label,
  sub,
  on,
  disabled = false,
  soon = false,
  onToggle,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-card border border-border bg-white/3 px-3.5 py-3 ${disabled ? 'opacity-50' : ''}`}
    >
      {icon && <span className="text-[22px]">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-extrabold">
          {label}
          {soon && (
            <span className="ml-1.5 rounded-md border border-border-strong px-1.5 py-0.5 text-[10px] font-bold tracking-[.08em] text-fg-muted">
              binnenkort
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-fg-muted">{sub}</div>
      </div>
      <Switch on={on} onToggle={onToggle} disabled={disabled} label={label} />
    </div>
  )
}
