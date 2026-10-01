import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { actionActor, actionSentence } from '../locales/actionSentence'
import { tvAnimations } from '../styles/motion'
import type { GameStateDto } from '../types/GameState'
import { Badge } from './ui/Badge'
import { ColorAvatar } from './ui/ColorAvatar'
import { GlassPanel } from './ui/GlassPanel'

export interface ActionTickerProps {
  state: GameStateDto
  /** Plaatsing in het bordgrid (rij 3, kolom 1); de ticker zelf bepaalt geen layout. */
  className?: string
}

/**
 * Het verloop op de TV (plan-testronde-tv punt 4, DESIGN.md § Action Ticker): de laatste acties
 * als één stilstaande rij, nieuwste links en oudere regels rechts ervan. Wat rechts niet meer past,
 * valt buiten beeld. De "Laatste"-kicker staat vast vóór de rij, niet in de nieuwste regel: in de regel
 * verhuisde hij bij elke nieuwe actie, en dan kromp de vorige regel in één frame en sprong de hele rij
 * (besluit gebruiker 2026-10-01). De state levert er hoogstens `TvRecentActionCount` (10), nieuwste
 * eerst.
 *
 * Een nieuwe regel komt links binnen (besluit gebruiker 2026-09-29, eerder rechts): de rij schuift
 * rustig over de breedte van de nieuwe regel(s) naar rechts (`tickerEnter`), en de nieuwe regel schuift
 * zichtbaar mee onder de kicker vandaan — geen invervagen, het bericht komt binnen (2026-10-01). Alleen
 * als het volgnummer van de bovenste regel verandert: niet bij het eerste renderen of een
 * reconnect, en niet bij een regel die alleen bijwerkt (een volgende plaatsing op hetzelfde gebied,
 * een belegering die een verovering wordt — die houden hun volgnummer). Komt er een nieuwe regel
 * binnen terwijl de vorige nog inschuift, dan begint de nieuwe vanaf waar de rij op dat moment
 * staat, zodat hij niet terugspringt. Onder `prefers-reduced-motion`, of zonder Web Animations API
 * (jsdom), staat de rij meteen op zijn plek.
 *
 * Zonder acties rendert er niets (The Invisible Design Rule); de rij in het bordgrid blijft wel
 * staan, zodat de kaart niet verspringt.
 */
export function ActionTicker({ state, className }: ActionTickerProps) {
  const { t } = useTranslation('actionTicker')
  const rowRef = useRef<HTMLDivElement>(null)

  const newestFirst = state.recentActions
  const headSequence = newestFirst[0]?.sequence
  const previousHeadSequence = useRef(headSequence)

  useLayoutEffect(() => {
    const previous = previousHeadSequence.current
    previousHeadSequence.current = headSequence
    const row = rowRef.current

    if (!row || previous === undefined || headSequence === undefined || headSequence === previous) return
    if (typeof row.animate !== 'function' || prefersReducedMotion()) return

    const entering = Array.from(row.children).filter(
      (item): item is HTMLElement => item instanceof HTMLElement && Number(item.dataset.sequence) > previous,
    )
    if (entering.length === 0) return

    const gap = parseFloat(getComputedStyle(row).columnGap) || 0
    const enteringWidth = entering.reduce((sum, item) => sum + item.offsetWidth + gap, 0)
    const stillToTravel = currentTranslateX(row)
    row.getAnimations().forEach((animation) => animation.cancel())

    const { durationMs, easing } = tvAnimations.tickerEnter
    row.animate(
      [{ transform: `translateX(${stillToTravel - enteringWidth}px)` }, { transform: 'none' }],
      { duration: durationMs, easing },
    )
  }, [headSequence])

  if (headSequence === undefined) return null

  return (
    <GlassPanel
      elevation="base"
      context="tv"
      padding="none"
      className={['flex min-h-0 min-w-0 flex-col overflow-hidden px-[18px] py-3', className].filter(Boolean).join(' ')}
      style={{ animation: tvAnimations.feedFrameIn }}
    >
      <div className="mb-2 font-body text-label font-extrabold uppercase tracking-[.1em] text-fg-muted">
        {t('title')}
      </div>
      <div className="flex min-w-0 items-center gap-3">
        {/* De rij hieronder knipt links af tegen de kicker, dus een nieuwe regel schuift er onderuit. */}
        <div className="flex-none">
          <Badge>{t('latest')}</Badge>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div ref={rowRef} data-testid="action-ticker-row" className="flex gap-3">
            {newestFirst.map((action) => {
              const { actor, color } = actionActor(action, state)

              return (
                <div
                  key={action.sequence}
                  data-sequence={action.sequence}
                  data-testid="action-ticker-item"
                  className="flex flex-none items-center gap-[11px] rounded-xl border px-[13px] py-[11px]"
                  style={{ background: 'var(--atlas-row)', borderColor: 'var(--border)' }}
                >
                  <ColorAvatar color={color} variant="row" />
                  <span className="whitespace-nowrap font-body text-h3 leading-[1.25] text-fg">
                    {actor && <b className="font-extrabold">{actor.name} </b>}
                    {actionSentence(action, state, t)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Waar een nog lopende inkomst de rij op dit moment heeft staan, negatief = nog links (0 als er niets loopt). */
function currentTranslateX(row: HTMLElement): number {
  const transform = getComputedStyle(row).transform

  return transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).m41 : 0
}
