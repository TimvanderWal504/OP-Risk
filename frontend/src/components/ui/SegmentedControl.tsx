export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

/** Rij van gelijk verdeelde keuzeknoppen waarvan er precies één actief is. */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-2.5">
      {options.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-13 flex-1 rounded-input border-2 font-display text-[15px] font-extrabold ${
              active
                ? 'border-pitch-500 bg-pitch-500/14 text-fg'
                : 'border-border bg-white/3 text-fg-muted'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
