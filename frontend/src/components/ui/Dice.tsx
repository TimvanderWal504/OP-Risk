import { useTranslation } from 'react-i18next'

export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

export interface DiceProps {
  value: DiceValue
  colorHex: string
  colorOnHex: string
  /** Zijde in pixels. */
  size: number
  radius: number
  padding: number
  gap: number
  pipSize: number
  boxShadow: string
  animation?: string
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

/** Pure dobbelsteen-weergave, getint met de kleur van de speler die gooit
 * (nooit een vast aanvaller/verdediger-kleurenschema — geen enkele
 * design-instantie doet dat). Bevat zelf geen worp- of kanslogica. */
export function Dice({ value, colorHex, colorOnHex, size, radius, padding, gap, pipSize, boxShadow, animation }: DiceProps) {
  const { t } = useTranslation('common')
  const pips = PIP_LAYOUT[value]

  return (
    <div
      role="img"
      aria-label={t('dice.ariaLabel', { value })}
      className="grid grid-cols-3 grid-rows-3"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        padding,
        gap,
        background: colorHex,
        boxShadow,
        animation,
      }}
    >
      {Array.from({ length: 9 }).map((_, cell) => (
        <span key={cell} aria-hidden className="flex items-center justify-center">
          {pips.includes(cell) && (
            <span className="rounded-full" style={{ width: pipSize, height: pipSize, background: colorOnHex }} />
          )}
        </span>
      ))}
    </div>
  )
}
