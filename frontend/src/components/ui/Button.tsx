import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { shadowGlowPitch } from '../../styles/design-tokens'
import {
  buttonPrimaryGlassTintOpaque,
  glassBorder,
  glassInnerHighlight,
  glassPanelBlurPx,
  glassSaturate,
  glassSurfaceOpaque,
} from '../../styles/glass-tokens'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

// Button is vandaag alleen op de telefoon in gebruik (grep bevestigd, geen TV-aanroep) —
// geen `context`-as zoals GlassPanel, blur vast op de phone-schaal. Als Button ooit op TV
// verschijnt, is dat een bevinding, geen aanname vooraf.
const BUTTON_BLUR_PX = glassPanelBlurPx('base', 'phone')

/**
 * Grote actieknop. `variant` wisselt tussen de brand-knop (primary, bv. "Start spel", "Gooien")
 * en een neutrale outline-knop (secondary); `disabled` grijst 'm uit. Neemt alle native
 * button-props over (`onClick`, `type`, `disabled`, …).
 *
 * Beide varianten delen dezelfde glas-surface-tokens/CSS-klasse als `GlassPanel`, rechtstreeks
 * op het `<button>`-element (geen genest `<GlassPanel>` — overbodige DOM-laag). Het onderscheid
 * zit in de kleurtint: `primary` krijgt een pitch-getinte surface plus de merkkleur-gloed
 * (DESIGN.md's "one glow"); `secondary` blijft neutraal en ongetint, zonder gloed.
 */
export function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  style,
  children,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === 'primary'

  const glassVars = {
    '--glass-bg-opaque': isPrimary ? buttonPrimaryGlassTintOpaque : glassSurfaceOpaque.base,
    '--glass-border': isPrimary ? glassBorder : 'var(--border-strong)',
    '--glass-inner-highlight': glassInnerHighlight,
    '--glass-shadow': isPrimary ? shadowGlowPitch : 'none',
    '--glass-filter': `blur(${BUTTON_BLUR_PX}px) saturate(${glassSaturate})`,
  } as CSSProperties

  return (
    <button
      type={type}
      data-glass-filter="on"
      data-glass-elevation="base"
      // `--on-pitch` (bijna zwart) is bedoeld voor tekst op een vólledig dekkend pitch-vlak — op
      // de translucente glas-tint hierboven is de achtergrond zelf al donker, dus bijna-zwarte
      // tekst erop was vrijwel onleesbaar. Beide varianten delen daarom dezelfde lichte
      // `--fg`-tekstkleur; het onderscheid blijft zitten in achtergrondtint en glow-shadow.
      // Geen `transition-opacity`: er bestaat geen motion.ts-token voor een disabled-fade —
      // instant staatwissel i.p.v. een zelfverzonnen duur, zelfde regel als Collapsible's chevron.
      className={`glass-panel min-h-16 w-full rounded-card font-display text-lg font-black text-fg disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ ...glassVars, ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}
