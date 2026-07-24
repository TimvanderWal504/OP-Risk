export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

export interface DiceProps {
  value: DiceValue
  /** Zijde in pixels. */
  size?: number
  variant?: 'attacker' | 'defender' | 'neutral'
}

/** Positie (0-8, links-boven → rechts-onder) van de stippen per ogenaantal. */
const PIP_LAYOUT: Record<DiceValue, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

const FACE_CLASS: Record<NonNullable<DiceProps['variant']>, string> = {
  attacker: 'bg-white',
  defender: 'bg-surface-2 border border-border-strong',
  neutral: 'bg-white',
}

const PIP_CLASS: Record<NonNullable<DiceProps['variant']>, string> = {
  attacker: 'bg-loss',
  defender: 'bg-white',
  neutral: 'bg-[#0a0e17]',
}

/** Pure dobbelsteen-weergave. Toont een vaste worp (server-authoritative) —
 * bevat zelf geen worp- of kanslogica. */
export function Dice({ value, size = 56, variant = 'neutral' }: DiceProps) {
  const pips = PIP_LAYOUT[value]

  return (
    <div
      role="img"
      aria-label={`Dobbelsteen ${value}`}
      className={`grid grid-cols-3 grid-rows-3 gap-1 rounded-input p-2 ${FACE_CLASS[variant]}`}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: 9 }).map((_, cell) => (
        <span key={cell} className="flex items-center justify-center">
          {pips.includes(cell) && (
            <span className={`h-1/2 w-1/2 rounded-full ${PIP_CLASS[variant]}`} />
          )}
        </span>
      ))}
    </div>
  )
}
