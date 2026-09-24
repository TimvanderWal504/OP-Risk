/**
 * Omrekening van een TV-weergave-sliderpositie (0–100, stap 5, `TvDisplaySettingsDto`) naar
 * een factor op het huidige design — de enige plek waar deze formule staat
 * (plan-testronde-tv punt 2, vastgesteld door de gebruiker 2026-09-24).
 *
 * Stuksgewijs lineair rond het design (50 → 1×):
 * - onder het design loopt de factor van `TV_DISPLAY_FLOOR` (bij 0) naar 1;
 * - boven het design is elke stap van 5 precies 10% van het design erbij (100 → 2×).
 *
 * Geldt gelijk voor tekstschaal, glasdekking, glasblur en dobbelsteenschaal.
 */
export const TV_DISPLAY_DESIGN_VALUE = 50
/** Sliderbereik en stapgrootte — gelijk aan `TvDisplaySettings.MinValue/MaxValue/Step` op de server. */
export const TV_DISPLAY_MIN_VALUE = 0
export const TV_DISPLAY_MAX_VALUE = 100
export const TV_DISPLAY_STEP = 5
/** Factor bij sliderpositie 0: 25% van het huidige effect. */
export const TV_DISPLAY_FLOOR = 0.25

export function sliderToMultiplier(value: number): number {
  if (value <= TV_DISPLAY_DESIGN_VALUE) {
    return TV_DISPLAY_FLOOR + (1 - TV_DISPLAY_FLOOR) * (value / TV_DISPLAY_DESIGN_VALUE)
  }

  return 1 + (value - TV_DISPLAY_DESIGN_VALUE) / TV_DISPLAY_DESIGN_VALUE
}

/**
 * Vermenigvuldigt elke `px`-lengte in een CSS-waarde (schaduw, transform) met `factor` — voor
 * elementen die als geheel schalen (TV-dobbelstenen), zodat ook hun schaduwen en diepte
 * meeschalen i.p.v. alleen de afmetingen. Bij `factor === 1` komt de waarde ongewijzigd terug.
 */
export function scaleCssPx(value: string, factor: number): string {
  if (factor === 1) return value

  return value.replace(/(-?\d*\.?\d+)px/g, (_, amount: string) => `${Number((Number(amount) * factor).toFixed(3))}px`)
}
