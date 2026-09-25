import { atlasRoughTok, boardMarkerTok, boardTok, seaRouteTok } from '../styles/design-tokens'
import { DESIGN_UNIT_PX, designToMap } from './boardScale'

/**
 * Randdikte van een gebied zonder eigenaar, in design-eenheden. De export kent geen neutrale
 * gebieden — `sw` is daar `isOwn ? tok.ownSw : tok.enSw` — dus dit is geen exportwaarde maar
 * een op 2026-08-03 met de gebruiker afgesproken keuze; zie de afwijkingenlijst in
 * frontend/CLAUDE.md. `boardTok.neuStroke` is nadrukkelijk géén dikte maar een opacity,
 * naast `ownStroke`/`enStroke`.
 */
export const NEUTRAL_STROKE_DESIGN_UNITS = 1.25

/** Alle markermaten uit `boardMarkerTok`, één keer omgerekend naar onze viewBox. */
export const marker = {
  discR: designToMap(boardMarkerTok.discR),
  ringSwOwn: designToMap(boardMarkerTok.ringSwOwn),
  ringSwEnemy: designToMap(boardMarkerTok.ringSwEnemy),
  armyFontSize: designToMap(boardMarkerTok.armyFontSize),
  nameOffsetY: designToMap(boardMarkerTok.nameOffsetY),
  nameFontSize: designToMap(boardMarkerTok.nameFontSize),
  nameStrokeWidth: designToMap(boardMarkerTok.nameStrokeWidth),
  /** Opacity, geen lengte-eenheid — gaat niet door `designToMap`. */
  nameStrokeOpacity: boardMarkerTok.nameStrokeOpacity,
} as const

/**
 * Vermenigvuldigt de genoemde lengtes in een marker-tokenset met `factor`; de rest (opacities,
 * randen van de gebiedspolygonen) blijft zoals hij is. Bij `factor === 1` komt exact dezelfde set
 * terug.
 */
function scaleLengths<T extends Record<string, number>>(tokens: T, factor: number, keys: readonly (keyof T)[]): T {
  if (factor === 1) return tokens

  const scaled = { ...tokens }
  for (const key of keys) {
    scaled[key] = (tokens[key] * factor) as T[keyof T]
  }

  return scaled
}

/**
 * `marker` geschaald met de TV-tekstschaal (plan-testronde-tv punt 2). De hele marker schaalt als
 * geheel — schijf, ring, legertal, gebiedsnaam, contour en de afstand tot de naam — zodat het
 * getal in z'n schijf blijft passen en de naam er niet in schuift.
 */
export function scaledMarker(factor: number) {
  return scaleLengths(marker, factor, [
    'discR',
    'ringSwOwn',
    'ringSwEnemy',
    'armyFontSize',
    'nameOffsetY',
    'nameFontSize',
    'nameStrokeWidth',
  ])
}

/**
 * `claimMarker` geschaald met de TV-tekstschaal: schijf, ring, symbool en de flare-ring eromheen
 * (die moet om de schijf heen blijven passen). De randdiktes van de gebiedspolygonen
 * (`territorySw*`) horen bij de kaart zelf, niet bij het label, en schalen niet mee.
 */
export function scaledClaimMarker(factor: number) {
  return scaleLengths(claimMarker, factor, ['discR', 'ringSw', 'symFontSize', 'flareR', 'flareSw'])
}

/** Randdikte van de gebiedspolygonen, idem omgerekend. */
export const territoryStroke = {
  own: designToMap(boardTok.ownSw),
  enemy: designToMap(boardTok.enSw),
  neutral: designToMap(NEUTRAL_STROKE_DESIGN_UNITS),
} as const

/**
 * Gloed-radius (CSS `drop-shadow`-blur) op de gebiedsrand, in spelerskleur — 2026-08-10,
 * bewuste, expliciet opgedragen wijziging ("fellere gebiedsgrenzen") bovenop de kaart-glas-
 * migratie. Startwaarden, tunable, nog niet visueel geverifieerd. Alleen toegepast op
 * gebieden mét een eigenaarskleur (own/enemy/claimed) — een grijze gloed op een neutraal
 * gebied voegt niets toe en zou het eigen/vijand-onderscheid vervuilen.
 */
export const territoryGlow = {
  own: designToMap(3),
  enemy: designToMap(2),
  claimed: designToMap(2.5),
} as const

/**
 * `seaRouteTok` omgerekend naar onze viewBox. Hoort bij de kaart zelf (zoals de gebiedsranden),
 * niet bij de markers, en schaalt dus niet mee met de TV-tekstschaal.
 */
export const seaRoute = {
  color: seaRouteTok.color,
  /** Opacity, geen lengte-eenheid — gaat niet door `designToMap`. */
  opacity: seaRouteTok.opacity,
  strokeWidth: designToMap(seaRouteTok.sw),
  dotGap: designToMap(seaRouteTok.dotGap),
} as const

/**
 * `atlasRoughTok` omgerekend naar onze viewBox. `scale` is een verplaatsing in
 * viewBox-eenheden en gaat via `designToMap` mee met de rest van de kaart; `baseFrequency`
 * is cycli per eenheid en schaalt daarom omgekeerd (grotere eenheden op onze grotere
 * viewBox → lagere frequentie nodig voor dezelfde ruwheid per schermpixel).
 */
export const atlasRough = {
  baseFrequency: atlasRoughTok.baseFrequency / DESIGN_UNIT_PX,
  numOctaves: atlasRoughTok.numOctaves,
  seed: atlasRoughTok.seed,
  scale: designToMap(atlasRoughTok.scale),
} as const

/**
 * Marker- en randmaten specifiek voor `TvClaimingScreen`, uit het oorspronkelijke TV-design
 * (`claimTerr`, `isClaim`-tak): een geclaimd gebied krijgt een dunnere polygoon-rand dan het
 * Hoofdscherm (`sw: claimed?2:1.5` i.p.v. `ownSw`/`enSw` uit `boardTok`, want Claiming kent geen
 * eigen/vijand-onderscheid — alleen geclaimd/vrij), en het laatst-geclaimde gebied krijgt zowel
 * een opvallende polygoon-rand (`sw:2.5`, `stroke:ctok.fg`) als de losse flare-ring (L228: r=40,
 * stroke-width=3, allebei in design-eenheden en dus door `designToMap`).
 */
export const claimMarker = {
  discR: designToMap(18),
  ringSw: designToMap(1.75),
  symFontSize: designToMap(18),
  territorySwClaimed: designToMap(2),
  territorySwFree: designToMap(1.5),
  territorySwFlare: designToMap(2.5),
  flareR: designToMap(40),
  flareSw: designToMap(3),
} as const
