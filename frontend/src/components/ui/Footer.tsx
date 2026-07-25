import type { ReactNode } from 'react'

export interface FooterProps {
  /** De actie(s), meestal één of meer {@link Button}s. Vrij wisselbaar zodat
   * hetzelfde onderbalk-frame elke context bedient. */
  children: ReactNode
  /** Foutmelding boven de knop(pen). */
  error?: string | null
  /** Toelichting onder de knop(pen). */
  hint?: ReactNode
  /** 'plain' (default): geen eigen chrome, leunt op de padding van het scherm
   * (join-schermen). 'gradient': eigen padding + fade-uit-achtergrond erboven
   * (instellingenscherm-CTA). */
  variant?: 'plain' | 'gradient'
}

/** Vaste onderbalk onderaan een scherm. Duwt zichzelf naar beneden (`mt-auto`)
 * en levert alleen het frame — de inhoud komt via `children`. */
export function Footer({ children, error = null, hint, variant = 'plain' }: FooterProps) {
  if (variant === 'gradient') {
    return (
      <div className="relative mt-auto flex-none bg-gradient-to-t from-[#080c13] from-26% to-transparent px-[18px] pt-3 pb-4">
        {error && <p className="mb-2 text-loss">{error}</p>}
        <div className="flex flex-col gap-3">{children}</div>
        {hint && <p className="mt-2 text-xs text-fg-muted">{hint}</p>}
      </div>
    )
  }

  return (
    <div className="mt-auto flex-none">
      {error && <p className="mb-2 text-loss">{error}</p>}
      <div className="flex flex-col gap-3">{children}</div>
      {hint && <p className="mt-2 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}
