import type { ReactNode } from 'react'

export interface PhoneShellProps {
  children: ReactNode
}

/**
 * Telefoon-viewport: gecentreerde kolom met vaste maxbreedte en de
 * hero-achtergrond. Omhult elk telefoon-scherm.
 *
 * Telefoon.dc.html L34 draait de stage altijd in het donkere thema, ongeacht
 * OS-voorkeur — vandaar de `dark`-klasse hier.
 */
export function PhoneShell({ children }: PhoneShellProps) {
  return (
    <div className="dark mx-auto flex h-full w-full max-w-[430px] flex-col bg-hero-pattern">
      {children}
    </div>
  )
}
