import type { ReactNode } from 'react'

export interface FooterProps {
  /** De actie(s), meestal één of meer {@link Button}s. Vrij wisselbaar zodat
   * hetzelfde onderbalk-frame elke context bedient. */
  children: ReactNode
  /** Foutmelding boven de knop(pen). */
  error?: string | null
  /** Toelichting onder de knop(pen). */
  hint?: ReactNode
}

/** Vaste onderbalk onderaan een scherm. Duwt zichzelf naar beneden (`mt-auto`)
 * en levert alleen het frame — de inhoud komt via `children`. */
export function Footer({ children, error = null, hint }: FooterProps) {
  return (
    <div className="mt-auto flex-none px-5 pt-3 pb-5">
      {error && <p className="mb-2 text-loss">{error}</p>}
      <div className="flex flex-col gap-3">{children}</div>
      {hint && <p className="mt-2 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}
