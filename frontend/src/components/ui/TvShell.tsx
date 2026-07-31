import type { ReactNode } from 'react'

export interface TvShellProps {
  children: ReactNode
}

/**
 * TV-viewport: de stage met de hero-achtergrond. Omhult elk host-scherm.
 *
 * Host-scherm.dc.html L34 draait de stage altijd in het donkere thema, ongeacht
 * OS-voorkeur — vandaar de `dark`-klasse hier, net als bij `PhoneShell`.
 */
export function TvShell({ children }: TvShellProps) {
  return <div className="dark h-full bg-hero-pattern">{children}</div>
}
