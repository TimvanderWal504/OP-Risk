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
 * Territoriumkaart-symbolen (FO §4.4, "Mijn kaarten"-paneel): militaire silhouetten, geen
 * unicode-glyph als vervanging (DESIGN.md). Zelfde conventie als de iconen hierboven.
 */

export function InfantryIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="3.6" r="1.6" />
      <path d="M8 5.4v3.4M5.2 7.6 8 6.4l2.8 1.2M6.1 13 8 8.8l1.9 4.2" />
    </svg>
  )
}

export function CavalryIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.6 13V9.7c0-1.6.9-2.9 2.2-3.5L6 4.2c-.2-.6.2-1.2.8-1.3l1.5-.3c.6-.1 1.1.1 1.4.6l1.3 1.9c1.1.2 2 1.1 2 2.3v1.4" />
    </svg>
  )
}

export function ArtilleryIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.4" cy="11" r="2.2" />
      <path d="M5.4 11 12.2 4.2M9 2.8l3.6 3.6" />
    </svg>
  )
}

export function JokerIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
      <path d="M8 1.6l1.6 3.6 3.9.4-2.9 2.7.8 3.9L8 10.3l-3.4 1.9.8-3.9-2.9-2.7 3.9-.4L8 1.6Z" />
    </svg>
  )
}
