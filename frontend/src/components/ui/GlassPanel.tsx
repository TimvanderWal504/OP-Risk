import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import {
  glassBorder,
  glassInnerHighlight,
  glassPanelBlurPx,
  glassPanelPadding,
  glassPanelRadius,
  glassSaturate,
  glassShadow,
  glassSurfaceOpaque,
  type GlassElevation,
  type GlassPanelContext,
} from '../../styles/glass-tokens'

export interface GlassPanelProps {
  /** Diepte-as: `base` (zijpanelen, instellingen) · `raised` (actieve speler, CTA-blok) · `overlay` (modals). */
  elevation: GlassElevation
  /** Device-as: `tv` (volle blur, illustratie eronder) · `phone` (lagere blur, geen illustratie eronder). */
  context: GlassPanelContext
  /**
   * Alleen `true` op panelen die zelf in-/uitanimeren (fade, schaal). `will-change`
   * is een geheugen-/compositekost, geen gratis performance-knop — vandaar niet
   * standaard aan, zie de opdracht-eis.
   */
  animated?: boolean
  /** `'default'` gebruikt `glassPanelPadding` (token); `'none'` voor panelen die hun eigen interne spacing meebrengen. */
  padding?: 'default' | 'none'
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Geneste-backdrop-filter-guard: elke GlassPanel zet deze context op `true` voor
 * zijn children. Een GlassPanel die zelf al binnen een GlassPanel rendert, leest
 * `true`, en laat zijn eigen `backdrop-filter` dan volledig weg (geen dubbele
 * GPU-kost, geen dubbel-vervaagd glas-op-glas-artefact) — mechanisme, niet een
 * documentatie-afspraak: er is geen manier om een geneste GlassPanel per ongeluk
 * wél een backdrop-filter te laten zetten.
 */
const GlassNestingContext = createContext(false)

/**
 * Gedeeld surface-primitive voor alle glaspanelen (TV én telefoon). Bepaalt
 * uitsluitend oppervlak — tint, blur/saturate, rand + top-highlight, schaduw,
 * radius en (optioneel) padding — nooit layout, positionering of grootte; dat
 * blijft aan de aanroeper (`className`/`style` voor zulke concerns).
 *
 * Backdrop-filter valt terug op een niet-filterende, ondoorzichtige surface in
 * drie gevallen, alle drie in `index.css` (`.glass-panel` + varianten):
 * - geneste GlassPanel (zie `GlassNestingContext` hierboven — hier al, vóór CSS)
 * - browser zonder `backdrop-filter`-support (`@supports not`)
 * - `prefers-reduced-transparency: reduce`
 */
export function GlassPanel({
  elevation,
  context,
  animated = false,
  padding = 'default',
  className,
  style,
  children,
}: GlassPanelProps) {
  const nested = useContext(GlassNestingContext)
  const filtered = !nested
  const blurPx = glassPanelBlurPx(elevation, context)

  const vars = {
    '--glass-bg-opaque': glassSurfaceOpaque[elevation],
    '--glass-border': glassBorder,
    '--glass-inner-highlight': glassInnerHighlight,
    '--glass-shadow': glassShadow[elevation],
    '--glass-filter': filtered ? `blur(${blurPx}px) saturate(${glassSaturate})` : 'none',
  } as CSSProperties

  return (
    <GlassNestingContext.Provider value={true}>
      <div
        className={['glass-panel', className].filter(Boolean).join(' ')}
        data-glass-filter={filtered ? 'on' : 'off'}
        data-glass-elevation={elevation}
        data-glass-animated={animated ? 'true' : 'false'}
        style={{
          ...vars,
          borderRadius: glassPanelRadius[elevation],
          ...(padding === 'default' ? { padding: glassPanelPadding } : {}),
          ...style,
        }}
      >
        {children}
      </div>
    </GlassNestingContext.Provider>
  )
}
