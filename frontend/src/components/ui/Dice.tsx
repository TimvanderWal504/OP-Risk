import { useTranslation } from 'react-i18next'
import {
  deriveDiceGlassGradient,
  diceGlassBlurPx,
  diceGlassPerspective,
  diceGlassShadow,
  dicePip,
  dicePipGlow,
  dicePipRecessedHighlight,
  dicePipRecessedInnerShadow,
  dicePipRecessedRim,
  glassSaturate,
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

/** Ingedrukt-putje-schaduw + spelerskleur-gloed voor een pip, als vaste fractie van de
 * pip-grootte — één centrale verhouding i.p.v. een los getal per aanroepplek (pipSize
 * varieert van 9 tot 20px over de vijf schermen die `Dice` gebruiken). Richting (licht
 * linksboven, dus schaduw rechtsonder in de put) is dezelfde als `diceGlassShadow` op de
 * surface eromheen — één lichtbron voor de hele dobbelsteen, niet los per laag gekozen.
 * `glowColor` is `dicePipGlow(colorHex)` bij een echte spelerskleur, anders 'transparent'
 * (neutrale fallback-surface heeft geen spelerskleur om te gloeien). */
function pipRecessedShadow(pipSize: number, glowColor: string): string {
  const offset = Math.max(1, Math.round(pipSize * 0.08))
  const blur = Math.max(2, Math.round(pipSize * 0.16))
  const glow = Math.max(4, Math.round(pipSize * 0.4))
  return (
    `inset 0 -${offset}px ${blur}px ${dicePipRecessedInnerShadow}, ` +
    `0 1px 0 ${dicePipRecessedRim}, ` +
    `0 0 ${glow}px ${glowColor}`
  )
}

/**
 * Pure dobbelsteen-weergave, getint met de kleur van de speler die gooit (nooit een
 * vast aanvaller/verdediger-kleurenschema). Bevat zelf geen worp- of kanslogica.
 *
 * Glas-migratie: de surface krijgt backdrop-filter blur + een diagonale
 * spelerskleur-gradient (`deriveDiceGlassGradient`) i.p.v. een dekkende
 * `background: colorHex`. De rand is de solide spelerskleur op 60% alpha zodat de
 * kleuridentiteit op TV-afstand herkenbaar blijft, ook tegen een lichte plek in de
 * achtergrondillustratie. De pips zelf (`dice.pip.*`/`dicePipRecessed*`) blijven
 * volledig ondoorzichtig en dragen geen eigen blur — alleen de surface eronder is
 * vervaagd.
 *
 * Glasoverhaul (2026-08-18, op verzoek van de gebruiker): de vulling zelf droeg tot nu
 * toe de kleuridentiteit bijna alleen (hoge, dekkende alpha); die verschuift nu naar de
 * rand + de pip-gloed (`dicePipGlow`), zodat de vulling zelf transparanter kan en het
 * gevechtsbeeld erdoorheen zichtbaar blijft — zie `diceGlassShadow`/`dicePipRecessed*`/
 * `diceGlassPerspective` in glass-tokens.ts voor de volledige toelichting per onderdeel
 * (gerichte lichtrichting, ingedrukte pips, glasplaat-diepte). De diagonale
 * specular-sweep-highlight staat als `.dice-glass-sweep` in index.css, niet hier — een
 * `::before`-pseudo-element kan niet via inline React-style.
 *
 * De animatie zit op een niet-filterende buiten-`<div>`, nooit op het element met
 * `backdrop-filter` zelf (frontend/CLAUDE.md §Mobiele randvoorwaarden): WebKit/iOS Safari
 * herrekent de achterliggende vervaging niet consequent per animatieframe wanneer
 * `transform`/`opacity` en `backdrop-filter` op hetzelfde element staan — zichtbaar gevolg:
 * sommige worpen "animeerden niet" (dobbelsteen verschijnt meteen in eindstand, geen tumble).
 * Zonder `animation`-prop (combat-/verdedig-dobbelstenen) blijft de DOM ongewijzigd: geen
 * extra wrapper. Gevolg voor de lichtrichting tijdens een worp: zie de `diceGlassShadow`-
 * toelichting in glass-tokens.ts — die draait zichtbaar mee met de buitenste wrapper, en
 * staat weer vast linksboven zodra de worp settelt (elke tumble-keyframe eindigt op
 * `rotate(0)`).
 */
export function Dice({ value, colorHex, context, size, radius, padding, gap, pipSize, animation }: DiceProps) {
  const { t } = useTranslation('common')
  const pips = PIP_LAYOUT[value]
  const isHex = HEX_PATTERN.test(colorHex)
  const surfaceFill = isHex ? deriveDiceGlassGradient(colorHex) : glassSurface.raised
  const pipGlow = isHex ? dicePipGlow(colorHex) : 'transparent'
  const blurPx = diceGlassBlurPx(context)
  const recessedShadow = pipRecessedShadow(pipSize, pipGlow)

  const surface = (
    <div
      role="img"
      aria-label={t('dice.ariaLabel', { value })}
      className="relative grid grid-cols-3 grid-rows-3 dice-glass-sweep"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        padding,
        gap,
        background: surfaceFill,
        backdropFilter: `blur(${blurPx}px) saturate(${glassSaturate})`,
        WebkitBackdropFilter: `blur(${blurPx}px) saturate(${glassSaturate})`,
        border: `1px solid color-mix(in srgb, ${colorHex} 60%, transparent)`,
        boxShadow: diceGlassShadow,
        transform: diceGlassPerspective,
      }}
    >
      {Array.from({ length: 9 }).map((_, cell) => (
        <span key={cell} aria-hidden className="flex items-center justify-center">
          {pips.includes(cell) && (
            <span
              className="rounded-full"
              style={{
                width: pipSize,
                height: pipSize,
                background: `${dicePipRecessedHighlight}, ${dicePip.fill}`,
                boxShadow: recessedShadow,
              }}
            />
          )}
        </span>
      ))}
    </div>
  )

  if (!animation) return surface

  return <div style={{ display: 'inline-block', width: size, height: size, animation }}>{surface}</div>
}
