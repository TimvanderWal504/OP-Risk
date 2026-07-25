import type { ValidationError } from '../types/ValidationError'
import { tDynamic } from './useT'

/**
 * SignalR `HubException` draagt alleen een string-message. `HubErrorSerializer`
 * (`src/RiskGame.Api/Hubs/HubErrorSerializer.cs`) codeert daar een JSON-array van
 * `ValidationError` in; dit is de tegenhanger die dat terugleest. Een bericht dat geen
 * geldige JSON is (bv. een SignalR-eigen transportfout, geen domeinfout) valt terug op
 * de generieke `errors:unknown`-code i.p.v. te crashen.
 */
export function parseHubError(message: string): ValidationError[] {
  try {
    const parsed: unknown = JSON.parse(message)

    if (Array.isArray(parsed) && parsed.every((item) => typeof item?.code === 'string')) {
      return parsed as ValidationError[]
    }
  } catch {
    // Geen JSON — val door naar de generieke fallback hieronder.
  }

  return [{ code: 'unknown' }]
}

/** Vertaalt en verbindt een lijst `ValidationError`s tot één weergavetekst, zelfde `' | '`-vorm als voorheen. */
export function translateValidationErrors(errors: ValidationError[]): string {
  return errors.map((error) => tDynamic(error.code, 'errors', error.params)).join(' | ')
}
