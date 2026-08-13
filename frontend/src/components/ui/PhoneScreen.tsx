import type { CSSProperties, ReactNode } from 'react'

export interface PhoneScreenProps {
  children: ReactNode
  /** Layout binnen het frame (centreren, `gap`, `text-align`) — nooit padding. */
  className?: string
  /** Alleen voor wat geen utility heeft, bv. de radiale achtergrond van
   *  `PlayerEliminatedScreen`. Zelfde ontsnappingsluik als `GlassPanel`. */
  style?: CSSProperties
}

/**
 * Het frame van één telefoonscherm: de gedeelde buitenmarge (`--spacing-gutter`,
 * 20px) plus de kolom-flexbox waar elk scherm op staat. Bedoeld als directe
 * wortel van alles wat onder `PhoneShell` rendert.
 *
 * Bestaansreden: vóór 2026-08-13 verzon elk scherm zijn eigen frame, met zes
 * verschillende horizontale waarden (16/18/20/22/24/26px) en bovenwaarden van
 * 2 tot 52px over 18 schermwortels. Daardoor verschoof de linkerrand van het
 * bovenste paneel zichtbaar bij elke fasewissel. `PhoneShell` had zelf geen
 * padding, terwijl DESIGN.md § Layout beweerde dat de schil de gutter droeg —
 * dit component maakt die bewering waar op één plek.
 *
 * Bewust géén padding-varianten: een prop met precies nul consumenten is de
 * manier waarop dezelfde drift terugkomt. De twee schermen met een afwijkende
 * structuur (`CreateGameForm` met zijn scrollende `<form>`, `DefendStep` als
 * full-screen `ModalShell`) gebruiken de `*-gutter`-utilities rechtstreeks en
 * landen zo op dezelfde waarde zonder dit contract op te rekken.
 *
 * Levert uitsluitend het frame — centreren, `gap`, `overflow` en achtergrond
 * blijven aan de aanroeper via `className`, hetzelfde contract als `GlassPanel`
 * voor surface.
 */
export function PhoneScreen({ children, className, style }: PhoneScreenProps) {
  return (
    <div
      className={['flex min-h-0 flex-1 flex-col p-gutter', className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </div>
  )
}
