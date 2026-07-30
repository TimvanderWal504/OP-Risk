export interface StatHeaderCardProps {
  kicker: string
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
 * Goudkleurige kop met kicker/titel links en een teller rechts (Telefoon.dc.html
 * L396-398 `isClaim/claimMine` en L453-455 `isSetup`) — identiek op gradient, border
 * en radius; alleen de verticale padding verschilt per scherm.
 */
export function StatHeaderCard({ kicker, title, statValue, statLabel, paddingY }: StatHeaderCardProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-[14px] border border-[var(--gold-700)] px-3.5 ${PADDING_Y[paddingY]}`}
      style={{ background: 'linear-gradient(90deg, rgba(242,169,34,.14), rgba(242,169,34,0))' }}
    >
      <div className="min-w-0">
        <div className="font-body text-[11px] font-extrabold tracking-[.12em] text-gold-400 uppercase">{kicker}</div>
        <div className="font-display text-[18px] font-extrabold">{title}</div>
      </div>
      <div className="flex-none text-right">
        <div className="font-display text-[34px] leading-none font-black text-gold-300">{statValue}</div>
        <div className="font-body text-[11px] text-fg-muted">{statLabel}</div>
      </div>
    </div>
  )
}
