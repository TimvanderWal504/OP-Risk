import type { ReactNode } from 'react'

export interface PhoneShellProps {
  children: ReactNode
}

/** Telefoon-viewport: gecentreerde kolom met vaste maxbreedte en de
 * hero-achtergrond. Omhult elk telefoon-scherm. */
export function PhoneShell({ children }: PhoneShellProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-[430px] flex-col bg-hero-pattern">
      {children}
    </div>
  )
}
