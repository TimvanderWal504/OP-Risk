export interface TvUrlPanelProps {
  gameId: string
  origin?: string
}

/**
 * Toont de /tv/:gameId-URL/code — blijvend zichtbaar voor de host (niet alleen direct na
 * het aanmaken), zodat de TV op elk moment opnieuw gekoppeld kan worden (bv. na een
 * herstart van de laptop, zie plan-b-reisopstelling.md).
 */
export function TvUrlPanel({ gameId, origin = window.location.origin }: TvUrlPanelProps) {
  const tvUrl = `${origin}/tv/${gameId}`

  return (
    <div className="rounded-card border border-border-strong bg-surface-2 p-4">
      <p className="twc-eyebrow">Open op de TV</p>
      <p className="font-mono text-sm break-all text-fg-secondary">{tvUrl}</p>
    </div>
  )
}
