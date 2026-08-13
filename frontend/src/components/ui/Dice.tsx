import { useTranslation } from 'react-i18next'
import {
  DICE_FACE_ALPHA,
  GLASS_SATURATE_KEEP,
  GLASS_TARGET_LIGHTNESS,
  deriveGlassTint,
  diceGlassBlurPx,
  dicePip,
  glassSaturate,
  glassShadow,
  glassSurface,
  type GlassPanelContext,
} from '../../styles/glass-tokens'

export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

export interface DiceProps {
  value: DiceValue
  /** Solid spelerskleur (hex). Ook aanvaard: een CSS-kleurvariabele (`var(--surface-3)`)
   * voor de "nog geen speler bekend"-fallback op DefendStep/AttackFlowStep — die kan niet
   * door `deriveGlassTint` (JS hex-parsing), dus valt terug op een neutrale glas-surface. */
  colorHex: string
  /** Device-as, zelfde contract als `GlassPanel`: bepaalt de blur-schaal (tv vol, phone gehalveerd). */
  context: GlassPanelContext
  /** Zijde in pixels. */
  size: number
  radius: number
  padding: number
  gap: number
  pipSize: number
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

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

/** Bevel-offset/-blur voor de pip-schaduw, als vaste fractie van de pip-grootte —
 * één centrale verhouding i.p.v. een los getal per aanroepplek (pipSize varieert
 * van 9 tot 20px over de vijf schermen die `Dice` gebruiken). Richting (top licht,
 * onder donker) is voor elke pip op elke dobbelsteen identiek. */
function pipBevelShadow(pipSize: number): string {
  const offset = Math.max(1, Math.round(pipSize * 0.16))
  const blur = Math.max(2, Math.round(pipSize * 0.32))
  return `inset 0 ${offset}px ${blur}px ${dicePip.shadow}, inset 0 -${offset}px ${blur}px ${dicePip.highlight}`
}

/**
 * Pure dobbelsteen-weergave, getint met de kleur van de speler die gooit (nooit een
 * vast aanvaller/verdediger-kleurenschema). Bevat zelf geen worp- of kanslogica.
 *
 * Glas-migratie: de surface krijgt backdrop-filter blur + de spelerskleur-tint
 * (`playerDiceFaceColors`-afleiding, via `deriveGlassTint`) i.p.v. een dekkende
 * `background: colorHex`. De rand is de solide spelerskleur op 60% alpha zodat de
 * kleuridentiteit op TV-afstand herkenbaar blijft, ook tegen een lichte plek in de
 * achtergrondillustratie. De pips zelf (`dice.pip.*`) blijven volledig ondoorzichtig
 * en dragen geen eigen blur — alleen de surface eronder is vervaagd.
 *
 * BEVINDING, opgelost (2026-08-10): `animation` (transform/opacity, bv. `phDice` — de
 * worp-entree op `OrderRollWaitStep`) stond eerst rechtstreeks op dit element, samen met
 * `backdrop-filter` — precies het patroon dat frontend/CLAUDE.md §Mobiele randvoorwaarden
 * uitsluit ("geen backdrop-filter op elementen die tijdens... transitie bewegen"). WebKit/
 * iOS Safari herrekent de achterliggende vervaging niet consequent per animatieframe van
 * hetzelfde element — zichtbaar gevolg: sommige worpen "animeerden niet" (de dobbelsteen
 * verschijnt meteen in eindstand, geen tumble). Fix: de animatie verhuist naar een niet-
 * filterende buiten-`<div>`; de gefilterde surface zelf staat stil en beweegt alleen mee als
 * onderdeel van die ouder — het element met `backdrop-filter` heeft dus zelf nooit een eigen
 * transform/opacity-animatie. Zonder `animation`-prop (combat-/verdedig-dobbelstenen) blijft
 * de DOM ongewijzigd: geen extra wrapper, `role="img"` staat op hetzelfde element als voorheen.
 */
export function Dice({ value, colorHex, context, size, radius, padding, gap, pipSize, animation }: DiceProps) {
  const { t } = useTranslation('common')
  const pips = PIP_LAYOUT[value]
  const isHex = HEX_PATTERN.test(colorHex)
  const surfaceTint = isHex
    ? deriveGlassTint(colorHex, DICE_FACE_ALPHA, GLASS_SATURATE_KEEP, GLASS_TARGET_LIGHTNESS)
    : glassSurface.raised
  const blurPx = diceGlassBlurPx(context)
  const bevelShadow = pipBevelShadow(pipSize)

  const surface = (
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
        background: surfaceTint,
        backdropFilter: `blur(${blurPx}px) saturate(${glassSaturate})`,
        WebkitBackdropFilter: `blur(${blurPx}px) saturate(${glassSaturate})`,
        border: `1px solid color-mix(in srgb, ${colorHex} 60%, transparent)`,
        boxShadow: glassShadow.raised,
      }}
    >
      {Array.from({ length: 9 }).map((_, cell) => (
        <span key={cell} aria-hidden className="flex items-center justify-center">
          {pips.includes(cell) && (
            <span
              className="rounded-full"
              style={{ width: pipSize, height: pipSize, background: dicePip.fill, boxShadow: bevelShadow }}
            />
          )}
        </span>
      ))}
    </div>
  )

  if (!animation) return surface

  return <div style={{ display: 'inline-block', width: size, height: size, animation }}>{surface}</div>
}
