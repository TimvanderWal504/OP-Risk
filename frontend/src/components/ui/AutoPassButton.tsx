export interface AutoPassButtonProps {
  label: string
  /** Toegankelijke naam met de speler erin ("Bob op auto-pass zetten"): elke rij heeft dezelfde zichtbare tekst. */
  accessibleLabel: string
  onClick: () => void
}

/**
 * De host-actie "Auto-pass" op een Stand-rij (DESIGN.md § Auto-pass): de klikbare vorm van de
 * silver-outline-`Badge` — zelfde chip-vorm, Label-letter en Recon Silver-rand/tekst — zodat de
 * handeling dezelfde taal spreekt als het kenmerk waarin hij verandert. Geen nieuwe knopsoort: de
 * volle-breedte-`Button` past niet in een rij. Het raakvlak is minstens 44×44px (`min-h-11`/`min-w-11`);
 * ingedrukt krijgt hij de tonale vulling `--atlas-row-2`, verder niets.
 */
export function AutoPassButton({ label, accessibleLabel, onClick }: AutoPassButtonProps) {
  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      onClick={onClick}
      className="inline-flex min-h-11 min-w-11 flex-none items-center justify-center rounded-chip border border-silver-700 px-4 font-body text-xs font-extrabold tracking-wide text-silver-400 uppercase active:bg-[var(--atlas-row-2)]"
    >
      {label}
    </button>
  )
}
