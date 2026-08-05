import type { ReactNode } from 'react'

export interface PhoneShellProps {
  children: ReactNode
}

/**
 * Telefoon-viewport: gecentreerde kolom met vaste maxbreedte en de
 * hero-achtergrond. Omhult elk telefoon-scherm.
 *
 * Het oorspronkelijke telefoon-design draait de stage altijd in het donkere thema, ongeacht
 * OS-voorkeur — vandaar de `dark`-klasse hier. `position:relative` spiegelt
 * de "stage"-div (L33, `position:relative;...;display:flex;flex-direction:column;`):
 * zonder dat positioneren volledig-scherm-overlays met `absolute inset-0`
 * (bv. `DefendStep`) zich relatief aan de hele pagina i.p.v. dit telefoonscherm —
 * bevinding, gevonden toen `DefendStep` als eerste zo'n overlay bleek te zijn
 * (2026-08-04). `border-radius`/`overflow:hidden` van de stage bewust niet
 * overgenomen: dat is de decoratieve telefoon-kaderrand van de bureaublad-demo,
 * niet zinvol op een echt mobiel scherm dat al edge-to-edge vult.
 */
export function PhoneShell({ children }: PhoneShellProps) {
  return (
    <div className="dark relative mx-auto flex h-full w-full max-w-[430px] flex-col bg-hero-pattern">
      {children}
    </div>
  )
}
