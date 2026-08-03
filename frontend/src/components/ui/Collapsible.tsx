import { useState } from 'react'
import type { ReactNode } from 'react'

export interface CollapsibleProps {
  title: ReactNode
  /** Optioneel meta-/samenvattingsblok naast de titel (bv. "3/4"-teller) — puur slot, geen
   *  domeinkennis hier. */
  summary?: ReactNode
  children: ReactNode
  defaultOpen: boolean
  /** `false`: altijd open gerenderd, geen chevron/toggle. Voor de enige-groep-case waar
   *  dichtklappen de speler naar niets zou laten kijken (zie `PlaceReinforcementStep`). */
  collapsible: boolean
}

/**
 * Generieke inklap-sectie — geen kennis van continenten, territoria of i18n. Labels/inhoud
 * komen van de aanroeper (frontend/CLAUDE.md, `components/ui`: klein en herbruikbaar).
 * Expand/collapse-timing staat niet in de export (geen van beide `.dc.html`-bestanden bevat
 * een inklapbare sectie) — puur een instant show/hide, geen `motion.ts`-waarde om over te
 * nemen; een animatie hier zou zelf verzonnen zijn.
 */
export function Collapsible({ title, summary, children, defaultOpen, collapsible }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = !collapsible || open

  return (
    <div>
      <button
        type="button"
        disabled={!collapsible}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 py-1 text-left disabled:cursor-default"
      >
        <span className="min-w-0 flex-1">{title}</span>
        <span className="flex items-center gap-2">
          {summary}
          {collapsible && (
            <span aria-hidden className="text-fg-muted">
              {isOpen ? '▾' : '▸'}
            </span>
          )}
        </span>
      </button>
      {isOpen && <div className="mt-2 flex flex-col gap-2">{children}</div>}
    </div>
  )
}
