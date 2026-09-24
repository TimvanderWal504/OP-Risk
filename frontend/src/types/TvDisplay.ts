/**
 * Spiegelt RiskGame.Api.Dtos.TvDisplaySettingsDto (src/RiskGame.Api/Dtos/TvDisplaySettingsDto.cs)
 * 1-op-1, inclusief enum-volgorde (enums serialiseren als `int`, zie `GameSettings.ts`).
 */
export const TvLanguageDto = {
  Nl: 0,
  En: 1,
} as const
export type TvLanguageDto = (typeof TvLanguageDto)[keyof typeof TvLanguageDto]

/**
 * De TV-weergave van een spel (plan-testronde-tv punt 2). De drie schaalwaarden zijn
 * sliderposities 0–100 in stappen van 5, 50 = het huidige design — geen factoren. De
 * omrekening naar een factor staat op één plek: `styles/tvDisplay.ts`.
 */
export interface TvDisplaySettingsDto {
  textScale: number
  glassOpacity: number
  glassBlur: number
  language: TvLanguageDto
  /** Eigen onderdeel: schaalt de TV-dobbelstenen als geheel, los van de tekstschaal. */
  diceScale: number
}
