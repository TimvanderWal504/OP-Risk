export interface IconProps {
  className?: string
}

/**
 * Gedeelde, lijnstijl-SVG-iconen (DESIGN.md: geen decoratieve unicode-emoji als
 * icoon-vervanger) — zelfde conventie als `Collapsible.tsx`/`RemovablePlayerRow.tsx`:
 * `viewBox="0 0 16 16"`, `stroke="currentColor"`, geen vulling. Vervangen hiermee de
 * emoji's die `PlayerHeader.tsx` nog gebruikte (🃏/🎯/📊/👑) — zie de doc-comment daar.
 * Elk icoon is zelf `aria-hidden`; het toegankelijke label komt van de aanroepende knop.
 */

export function CardsIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2.2" y="3.4" width="8.6" height="10.8" rx="1.4" transform="rotate(-9 6.5 8.8)" />
      <rect x="5.2" y="1.8" width="8.6" height="10.8" rx="1.4" />
    </svg>
  )
}

export function MissionIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="8" cy="8" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function InfoIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M3.2 13V9.2M8 13V4.4M12.8 13V7" />
    </svg>
  )
}

export function LockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7.2" width="10" height="7" rx="1.4" />
      <path d="M5.4 7.2V5.4a2.6 2.6 0 0 1 5.2 0v1.8" />
    </svg>
  )
}

export function CrownIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round">
      <path d="M2.5 12.5h11L12.5 6l-2.8 2.3L8 5l-1.7 3.3L3.5 6l-1 6.5Z" />
    </svg>
  )
}

/**
 * Territoriumkaart-symbolen (FO §4.4, "Mijn kaarten"-paneel): sinds taak 5-vervolg de door de
 * gebruiker aangeleverde gevulde silhouetten in `./cardSymbolIcons.tsx` (bewuste, benoemde
 * afwijking van de lijnstijl-conventie hierboven — zie DESIGN.md, Components → Card Symbol
 * Icons). De eerdere zelf getekende lijnstijl-placeholders (`InfantryIcon`/`CavalryIcon`/
 * `ArtilleryIcon`/`JokerIcon`) zijn hier vervallen: niets verwijst er nog naar.
 */
