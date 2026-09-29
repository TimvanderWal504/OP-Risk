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

/** TV-scherm op een voet — de "TV-weergave"-actie van de host (plan-testronde-tv punt 2). */
export function TvIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.8" y="2.6" width="12.4" height="8.4" rx="1.4" />
      <path d="M5.6 13.6h4.8M8 11v2.6" />
    </svg>
  )
}

/**
 * Gebeurtenisronde (DESIGN.md § Event Round): één lijn-icoon per soort gevolg, zelfde conventie als
 * hierboven. Bonus en legerverlies zijn elkaars spiegel (plus/min in een cirkel); een afgesloten
 * gebied hergebruikt `LockIcon`.
 */
export function EventBonusIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 5v6M5 8h6" />
    </svg>
  )
}

export function EventArmyLossIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M5 8h6" />
    </svg>
  )
}

/** Twee golven met een schuine streep erdoor: zeeroutes dicht. */
export function EventSeaBlockadeIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.8 6.6c1.1-1 2.1-1 3.1 0s2.1 1 3.1 0 2.1-1 3.1 0 2.1 1 3.1 0" />
      <path d="M1.8 10.6c1.1-1 2.1-1 3.1 0s2.1 1 3.1 0 2.1-1 3.1 0 2.1 1 3.1 0" />
      <path d="M3 13.6 13 2.4" />
    </svg>
  )
}

/** Een kaart met een vonk: een gebeurtenis zonder eigen soort (`Other`). */
export function EventCardIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.4" y="1.8" width="9.2" height="12.4" rx="1.4" />
      <path d="M8 5.2v5.6M5.2 8h5.6" />
    </svg>
  )
}

/** Vinkje: een wachtende speler heeft gekozen (attrition-wachtstaat op de TV). */
export function CheckIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.4 6.6 11.4 12.5 4.8" />
    </svg>
  )
}

/** Twee pijlen vooruit: "Verder op TV" — de host klikt een wachttijd op de TV door (FO §2.2). */
export function SkipForwardIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 3.5 7.5 8l-5 4.5V3.5ZM8.5 3.5 13.5 8l-5 4.5V3.5Z" />
    </svg>
  )
}

/** Kruisje om iets weg te klikken (fouttoast, `Toast`). */
export function CloseIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
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

