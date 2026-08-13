import type { CSSProperties, ReactNode } from 'react'
import { GlassPanel } from './GlassPanel'
import type { GlassPanelContext } from '../../styles/glass-tokens'

export interface ModalShellProps {
  context: GlassPanelContext
  animated?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Gedeelde full-bleed modal-surface (`GlassPanel elevation="overlay"`). Fase
 * 3b: CHROME, want de achtergrond/rand/schaduw-laag zelf draagt geen
 * spelstand/identiteit/tijd/uitkomst — die zit in de content erbinnen
 * (dobbelstenen, spelersnamen, resultaat, INFORMATIE, ongewijzigd). Vervangt
 * de twee losse, met de hand gebouwde overlays in `TvCombatOverlay.tsx`
 * (`background: var(--atlas-overlay)`) en `DefendStep.tsx`
 * (`linear-gradient(var(--live-soft),var(--bg))`). Positionering (`absolute
 * inset-0`, `z-[…]`) blijft bij de aanroeper — zelfde contract als
 * `GlassPanel` zelf.
 */
export function ModalShell({ context, animated, className, style, children }: ModalShellProps) {
  return (
    <GlassPanel
      elevation="overlay"
      context={context}
      animated={animated}
      padding="none"
      className={className}
      style={style}
    >
      {children}
    </GlassPanel>
  )
}
