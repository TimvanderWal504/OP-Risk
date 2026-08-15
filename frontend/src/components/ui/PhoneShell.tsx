import type { ReactNode } from 'react'
import { PhoneStageBackground } from './PhoneStageBackground'
import type { StageScrimLevel } from '../../styles/glass-tokens'

export interface PhoneShellProps {
  children: ReactNode
  /** Scrim-intensiteit van de persistente stage-achtergrond, zie `phoneScreens.resolveStageScrimLevel`. */
  scrimLevel?: StageScrimLevel
}

/**
 * Telefoon-viewport: gecentreerde kolom met vaste maxbreedte en de hero-achtergrond. Omhult elk
 * telefoon-scherm.
 *
 * `position:relative` is nodig zodat volledig-scherm-overlays met `absolute inset-0` (bv.
 * `DefendStep`) zich relatief aan dit telefoonscherm positioneren i.p.v. aan de hele pagina.
 * Geen `border-radius`/`overflow:hidden`: dat hoort bij een decoratief telefoonkader, niet
 * zinvol op een echt mobiel scherm dat al edge-to-edge vult.
 *
 * `PhoneStageBackground` staat als sibling vóór `children`, zelfde stacking-reden als
 * `TvShell`/`TvStageBackground` (zie de doc-comment daar): de illustratie is intern `absolute`,
 * dus zonder een `relative` content-wrapper zou platte tekst zonder eigen backdrop-filter/
 * transform onzichtbaar onder de illustratie verdwijnen.
 */
export function PhoneShell({ children, scrimLevel = 'lobby' }: PhoneShellProps) {
  return (
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col bg-hero-pattern">
      <PhoneStageBackground level={scrimLevel} />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
