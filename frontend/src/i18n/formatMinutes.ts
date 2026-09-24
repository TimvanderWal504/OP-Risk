/**
 * Een timerduur als "3 min" of "2:30 min" — gedeeld door het lobbyoverzicht op de TV en de
 * spelregels in spelinfo, zodat een ingestelde beurttimer overal hetzelfde leest.
 */
export function formatMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return rest === 0 ? `${minutes} min` : `${minutes}:${rest.toString().padStart(2, '0')} min`
}
