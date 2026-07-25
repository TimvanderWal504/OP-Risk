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
}

/** Eén selecteerbare, omrande keuze-kaart (radio-semantiek). Verzorgt de
 * gedeelde selected/disabled-styling; de inhoud (swatch, naam, badges) komt via
 * `children`, zodat kleur-grid en rol-lijst dezelfde basis delen. */
export function SelectableOption({
  selected,
  disabled = false,
  onSelect,
  children,
  className = '',
  selectedBorderVar = 'var(--pitch-500)',
  unselectedBorderVar = 'var(--border-strong)',
  disabledBorderVar = 'var(--border)',
}: SelectableOptionProps) {
  const borderColor = disabled ? disabledBorderVar : selected ? selectedBorderVar : unselectedBorderVar

  return (
    <button
      type="button"
      role="radio"
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
