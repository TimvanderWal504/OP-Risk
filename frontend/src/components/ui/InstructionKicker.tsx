import type { CSSProperties, ReactNode } from 'react'
import { GlassPanel } from './GlassPanel'
import { kickerGlassTintOpaque } from '../../styles/glass-tokens'

export interface InstructionKickerProps {
  children: ReactNode
}

/**
 * Instructie-kicker boven het TV-bord tijdens Claiming/InitialPlacement
 * ("Claim gebied" / "Plaats leger", `claimKicker`/`placeTitle`). Fase 3b:
 * CHROME (geen spelstand/identiteit/tijd/uitkomst) — voorheen identieke,
 * gedupliceerde chip-markup in `TvClaimingScreen.tsx` en
 * `TvInitialPlacementScreen.tsx`, nu één component op `GlassPanel`.
 */
export function InstructionKicker({ children }: InstructionKickerProps) {
  return (
    <GlassPanel
      elevation="base"
      context="tv"
      padding="none"
      className="rounded-xl px-6.5 py-3 font-display text-h2 font-black tracking-[.02em] text-pitch-300"
      style={
        {
          border: '1px solid var(--pitch-700)',
          '--glass-bg-opaque': kickerGlassTintOpaque,
        } as CSSProperties
      }
    >
      {children}
    </GlassPanel>
  )
}
