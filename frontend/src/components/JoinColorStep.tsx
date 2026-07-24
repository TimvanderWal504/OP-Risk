import type { PlayerColorDto } from '../types/GameState'
import { SelectableOption } from './ui/SelectableOption'

export interface JoinColorStepProps {
  colors: PlayerColorDto[]
  takenColorIds: string[]
  selectedColorId: string | null
  onPick: (colorId: string) => void
  error?: string | null
}

/** Tweede join-stap (FO §3): kleur kiezen, bezette kleuren live geblokkeerd. */
export function JoinColorStep({
  colors,
  takenColorIds,
  selectedColorId,
  onPick,
  error = null,
}: JoinColorStepProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <h1 className="font-display text-h1 font-bold">Kies je kleur</h1>
      {error && <p className="text-loss">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        {colors.map((color) => {
          const taken = takenColorIds.includes(color.id) && selectedColorId !== color.id
          const selected = selectedColorId === color.id

          return (
            <SelectableOption
              key={color.id}
              selected={selected}
              disabled={taken}
              onSelect={() => onPick(color.id)}
              className="flex min-h-16 items-center gap-3 px-4"
            >
              <span
                className="h-9 w-9 flex-none rounded-input"
                style={{ background: color.hex }}
                aria-hidden
              />
              <span className="font-display font-bold">{color.name}</span>
              {taken && <span className="absolute right-3 text-xs text-fg-muted">Bezet</span>}
              {selected && <span className="absolute right-3 text-pitch-400">✓</span>}
            </SelectableOption>
          )
        })}
      </div>
    </div>
  )
}
