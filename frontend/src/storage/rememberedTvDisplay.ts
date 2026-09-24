import { TvLanguageDto, type TvDisplaySettingsDto } from '../types/TvDisplay'
import { TV_DISPLAY_MAX_VALUE, TV_DISPLAY_MIN_VALUE, TV_DISPLAY_STEP } from '../styles/tvDisplay'

/**
 * De laatst bevestigde TV-weergave op dit toestel (plan-testronde-tv punt 2): de host-telefoon
 * onthoudt 'm en stuurt 'm mee bij "Nieuw spel", zodat dezelfde TV bij een volgend spel niet
 * terugvalt op het design. Binnen een spel blijft de server de bron — dit is alleen een
 * startwaarde voor het volgende.
 */
export const TV_DISPLAY_STORAGE_KEY = 'riskop:tvDisplay'

/**
 * Leest de onthouden waarden, of `null` als er niets (bruikbaars) is. Een beschadigde of
 * verouderde cache wordt weggegooid in plaats van meegestuurd: de server zou 'm weigeren, en
 * dan faalt "Nieuw spel" op een cosmetische instelling (elite-code-review bevinding 3). De
 * bereik-/stapcontrole spiegelt de server-guard (`TvDisplayGuards`), die de echte afdwinging
 * blijft doen.
 */
export function readRememberedTvDisplay(): TvDisplaySettingsDto | null {
  try {
    const raw = localStorage.getItem(TV_DISPLAY_STORAGE_KEY)
    if (raw === null) return null

    const parsed = parseJson(raw)
    if (isValid(parsed)) return parsed

    localStorage.removeItem(TV_DISPLAY_STORAGE_KEY)
    return null
  } catch {
    // Geen opslag beschikbaar (privévenster, geblokkeerd): niets onthouden.
    return null
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Onthoudt de door de server bevestigde waarden — nooit de invoer (elite-code-review bevinding 8). */
export function rememberTvDisplay(settings: TvDisplaySettingsDto): void {
  try {
    localStorage.setItem(TV_DISPLAY_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Geen opslag beschikbaar (privévenster, geblokkeerd): dan begint het volgende spel op het
    // design — geen fout die de speler hoeft te zien.
  }
}

function isValidScale(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= TV_DISPLAY_MIN_VALUE &&
    value <= TV_DISPLAY_MAX_VALUE &&
    value % TV_DISPLAY_STEP === 0
  )
}

function isValid(value: unknown): value is TvDisplaySettingsDto {
  if (typeof value !== 'object' || value === null) return false

  const settings = value as Record<string, unknown>

  return (
    isValidScale(settings.textScale) &&
    isValidScale(settings.glassOpacity) &&
    isValidScale(settings.glassBlur) &&
    isValidScale(settings.diceScale) &&
    Object.values(TvLanguageDto).includes(settings.language as TvLanguageDto)
  )
}
