import type { ReactNode } from 'react'

export interface SelectableOptionProps {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  children: ReactNode
  /** Extra layout-classes voor de inhoud (grid-tegel vs. lijst-rij). */
  className?: string
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
}: SelectableOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      className={`relative rounded-card border-2 disabled:opacity-50 ${className}`}
      style={{ borderColor: selected ? 'var(--pitch-400)' : 'var(--border-strong)' }}
    >
      {children}
    </button>
  )
}
