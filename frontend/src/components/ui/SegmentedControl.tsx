import { GlassPanel } from './GlassPanel'

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
    <div className="flex gap-[9px]">
      {options.map((option) => {
        const active = option.value === value

        if (active) {
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className="min-h-13 flex-1 rounded-[12px] border-2 border-pitch-500 bg-pitch-500/14 font-display text-[15px] font-extrabold text-fg"
            >
              {option.label}
            </button>
          )
        }

        return (
          <GlassPanel key={option.value} elevation="base" context="phone" padding="none" className="min-h-13 flex-1 rounded-[12px]">
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className="flex h-full w-full items-center justify-center font-display text-[15px] font-extrabold text-fg-muted"
            >
              {option.label}
            </button>
          </GlassPanel>
        )
      })}
    </div>
  )
}
