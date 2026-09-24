import type { ReactNode } from 'react'
import { GlassPanel } from './GlassPanel'

export interface PanelSectionProps {
  /** Kicker boven het blok — uppercase, zelfde stijl als het "GEHEIME MISSIE"-label van `MissionPanel`. */
  label: string
  children: ReactNode
}

/**
 * Eén onderdeel van een telefoon-paneel: een label-kicker boven een raised glazen blok. Gedeeld
 * door `TvDisplayPanel` en `GameInfoPanel`, zodat beide panelen dezelfde sectie-opbouw hebben.
 */
export function PanelSection({ label, children }: PanelSectionProps) {
  return (
    <GlassPanel elevation="raised" context="phone" className="flex flex-col gap-3">
      <span className="font-body text-xs font-extrabold tracking-[.12em] text-fg-muted uppercase">{label}</span>
      {children}
    </GlassPanel>
  )
}
