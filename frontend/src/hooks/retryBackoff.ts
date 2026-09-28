/** Wachttijd vóór de eerste herhaalpoging na een mislukte leesactie op de TV; verdubbelt per poging. */
export const RETRY_BASE_MS = 1000
/** Bovengrens van die wachttijd — zelfde plafond als het herverbinden in `GameHubProvider`. */
export const RETRY_MAX_MS = 30_000

/**
 * Wachttijd vóór poging `attempt + 1`. Voor schermen zonder bediening (de TV, FO §2.1): daar kan
 * niemand op "opnieuw" drukken, dus proberen ze het zelf, met oplopende tussenpozen.
 */
export function retryDelayMs(attempt: number): number {
  return Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS)
}
