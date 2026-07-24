import { Badge } from './ui/Badge'

export interface TvPageHeaderProps {
  badge: string
}

/** Branding-regel boven elk TV-fasescherm (Lobby, OrderRoll, …), met een fase-kicker. */
export function TvPageHeader({ badge }: TvPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-none items-center justify-between">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-h1 font-black tracking-wide">OPERATIE ATLAS</span>
        <span className="h-1.5 w-14 rounded-full bg-pitch-500" />
        <span className="font-mono text-fg-muted tracking-wide">CAMPAGNE-TERMINAL</span>
      </div>
      <Badge>{badge}</Badge>
    </div>
  )
}
