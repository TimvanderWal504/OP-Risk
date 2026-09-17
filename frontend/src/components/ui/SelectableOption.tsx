import type { ReactNode } from 'react'

export interface SelectableOptionProps {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  children: ReactNode
  /** Extra layout-classes voor de inhoud (grid-tegel vs. lijst-rij). */
  className?: string
  /** Randkleur wanneer geselecteerd. Default 'var(--pitch-500)' (rollenlijst/kleurenraster). */
  selectedBorderVar?: string
  /** Randkleur wanneer niet geselecteerd en niet disabled. Default 'var(--border-strong)' (rollenlijst). */
  unselectedBorderVar?: string
  /** Randkleur wanneer disabled (bv. door een andere speler bezet). Default 'var(--border)' (rollenlijst). */
  disabledBorderVar?: string
  /**
   * `'radio'` (default): mutueel exclusief binnen een groep — kleur-/rol-/legerpreset-keuzes.
   * `'checkbox'`: onafhankelijk aan/uit te zetten, meerdere tegels tegelijk geselecteerd (bv.
   * kaarten kiezen voor een inleg) — `role="radio"`/`aria-checked` zou daar onjuist suggereren
   * dat de keuzes elkaar uitsluiten.
   */
  role?: 'radio' | 'checkbox'
}

/** Eén selecteerbare, omrande keuze-kaart. Verzorgt de gedeelde selected/disabled-styling; de
 * inhoud (swatch, naam, badges) komt via `children`, zodat kleur-grid, rol-lijst en een
 * multi-select-raster (kaarten) dezelfde basis delen. */
export function SelectableOption({
  selected,
  disabled = false,
  onSelect,
  children,
  className = '',
  selectedBorderVar = 'var(--pitch-500)',
  unselectedBorderVar = 'var(--border-strong)',
  disabledBorderVar = 'var(--border)',
  role = 'radio',
}: SelectableOptionProps) {
  const borderColor = disabled ? disabledBorderVar : selected ? selectedBorderVar : unselectedBorderVar

  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      className={`relative rounded-card border-2 disabled:opacity-50 ${className}`}
      style={{ borderColor }}
    >
      {children}
    </button>
  )
}
