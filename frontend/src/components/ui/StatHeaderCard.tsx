export interface StatHeaderCardProps {
  title: string
  statValue: number | string
  statLabel: string
  /** Verticale padding in px — 11 bij Claim (L396), 12 bij Startopstelling (L453). */
  paddingY: 11 | 12
}

const PADDING_Y = {
  11: 'py-[11px]',
  12: 'py-3',
} as const

/**
 * Zilverkleurige kop met titel links en een teller rechts (`isClaim/claimMine`-
 * en `isSetup`-substaten in het oorspronkelijke design) — identiek op gradient, border
 * en radius; alleen de verticale padding verschilt per scherm.
 */
export function StatHeaderCard({ title, statValue, statLabel, paddingY }: StatHeaderCardProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-[14px] border border-[var(--silver-700)] px-3.5 ${PADDING_Y[paddingY]}`}
      style={{ background: 'linear-gradient(90deg, rgba(156,176,202,.14), rgba(156,176,202,0))' }}
    >
      <div className="min-w-0">
        <div className="font-display text-h3 font-extrabold">{title}</div>
      </div>
      <div className="flex-none text-right">
        <div className="font-display text-[34px] leading-none font-black text-silver-300">{statValue}</div>
        <div className="font-body text-xs text-fg-muted">{statLabel}</div>
      </div>
    </div>
  )
}
