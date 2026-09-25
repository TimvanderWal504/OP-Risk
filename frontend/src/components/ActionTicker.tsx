import type { TFunction } from 'i18next'
import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { tDynamic } from '../i18n/useT'
import { useTvDisplayScale } from '../hooks/useTvDisplayScale'
import { tvAnimations } from '../styles/motion'
import { RecentActionKindDto, type GameStateDto, type RecentActionDto } from '../types/GameState'
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
 * als één doorlopende band van rechts naar links, nieuwste vooraan met een "Laatste"-kicker.
 *
 * De band staat er twee keer in; de animatie schuift precies één kopie op (`atlasTicker`, -50%),
 * zodat de lus naadloos sluit. De duur volgt uit de gemeten breedte van één kopie
 * (`tickerSpeedPxPerS`), dus een langer verloop of een grotere tekstschaal loopt niet sneller.
 * Komt er een nieuwe regel bovenaan (ander `sequence`) of wordt de bovenste een verovering, dan
 * begint de band opnieuw, met die regel links in beeld; een regel die alleen bijwerkt (een
 * volgende plaatsing op hetzelfde gebied) laat de band doorlopen. Onder `prefers-reduced-motion`
 * staat de band stil (globale regel in `twc-theme.css`/`index.css`).
 *
 * Zonder acties rendert er niets (The Invisible Design Rule); de rij in het bordgrid blijft wel
 * staan, zodat de kaart niet verspringt.
 */
export function ActionTicker({ state, className }: ActionTickerProps) {
  const { t } = useTranslation('actionTicker')
  const { text: textScale } = useTvDisplayScale('tv')
  const copyRef = useRef<HTMLDivElement>(null)
  const bandRef = useRef<HTMLDivElement>(null)

  const actions = state.recentActions
  const head = actions[0]
  const restartKey = head ? `${head.sequence}-${head.kind}` : 'empty'
  const sentences = actions.map((action) => sentenceFor(action, state, t))

  // De duur zet hier rechtstreeks de animatie op de band (geen React-state: dat zou een extra
  // render per meting kosten). Alleen bij een herstart (nieuwe band, `restartKey`) of een andere
  // tekstschaal: een bijgewerkte regel verandert de breedte een fractie, en een nieuwe duur op een
  // lopende animatie laat de band verspringen — de lus blijft naadloos want -50% volgt de echte
  // breedte, alleen de snelheid wijkt dan tot de volgende herstart een fractie af. In een omgeving
  // zonder layout (breedte 0) blijft de band stil staan.
  useLayoutEffect(() => {
    const band = bandRef.current
    const width = copyRef.current?.scrollWidth ?? 0
    if (!band) return
    band.style.animation = width > 0 ? tvAnimations.ticker(width / tvAnimations.tickerSpeedPxPerS) : 'none'
  }, [restartKey, textScale])

  if (!head) return null

  const renderCopy = (copy: 'first' | 'second') => (
    <div
      ref={copy === 'first' ? copyRef : undefined}
      aria-hidden={copy === 'second' ? true : undefined}
      className="flex flex-none gap-3 pr-3"
    >
      {actions.map((action, index) => {
        const actor = action.playerId ? state.players.find((player) => player.id === action.playerId) : undefined
        const color = actor ? state.colors.find((c) => c.id === actor.colorId) : null

        return (
          <div
            key={action.sequence}
            data-testid={copy === 'first' ? 'action-ticker-item' : undefined}
            className="flex flex-none items-center gap-[11px] rounded-xl border px-[13px] py-[11px]"
            style={{ background: 'var(--atlas-row)', borderColor: 'var(--border)' }}
          >
            {index === 0 && <Badge>{t('latest')}</Badge>}
            <ColorAvatar color={color} variant="row" />
            <span className="whitespace-nowrap font-body text-h3 leading-[1.25] text-fg">
              {actor && <b className="font-extrabold">{actor.name} </b>}
              {sentences[index]}
            </span>
          </div>
        )
      })}
    </div>
  )

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
      <div className="min-w-0 overflow-hidden">
        <div key={restartKey} ref={bandRef} data-testid="action-ticker-band" className="flex w-max">
          {renderCopy('first')}
          {renderCopy('second')}
        </div>
      </div>
    </GlassPanel>
  )
}

function playerName(state: GameStateDto, playerId: string | null): string {
  return state.players.find((player) => player.id === playerId)?.name ?? ''
}

function territoryName(territoryId: string | null): string {
  return territoryId ? tDynamic(territoryId, 'territories') : ''
}

/** De zin na de spelernaam; bedragen, totalen en namen komen uit de DTO, nooit berekend. */
function sentenceFor(
  action: RecentActionDto,
  state: GameStateDto,
  t: TFunction<'actionTicker'>,
): string {
  const territory = territoryName(action.territoryId)
  const from = territoryName(action.fromTerritoryId)
  const other = playerName(state, action.otherPlayerId)
  const losses = { attackerLosses: action.attackerLosses, defenderLosses: action.defenderLosses }

  switch (action.kind) {
    case RecentActionKindDto.TerritoriesDealt:
      return t('dealt')
    case RecentActionKindDto.TerritoryClaimed:
      return t('claimed', { territory })
    case RecentActionKindDto.ReinforcementsGranted:
      return t('granted', { count: action.amount })
    case RecentActionKindDto.ArmiesPlaced:
      return action.amount === 1
        ? t('placedOne', { territory, total: action.total })
        : t('placed', { count: action.amount, territory, total: action.total })
    case RecentActionKindDto.CardsTraded:
      return t('traded', { count: action.amount })
    case RecentActionKindDto.CardTradeReverted:
      return t('tradeReverted', { count: action.amount })
    case RecentActionKindDto.Attack:
      return t('attack', { defender: other, to: territory, from, ...losses })
    case RecentActionKindDto.Conquered: {
      const base = { defender: other, to: territory, from, ...losses }
      if (action.amount === null) return t('conquered', base)
      return action.amount === 1
        ? t('conqueredMovedOne', { ...base, total: action.total })
        : t('conqueredMoved', { ...base, count: action.amount, total: action.total })
    }
    case RecentActionKindDto.Fortified:
      return action.amount === 1
        ? t('fortifiedOne', { from, to: territory, total: action.total })
        : t('fortified', { count: action.amount, from, to: territory, total: action.total })
    case RecentActionKindDto.PlayerEliminated:
      return t('eliminated', { eliminated: other })
    case RecentActionKindDto.LastChanceOpened:
      return t('lastChanceOpened')
    case RecentActionKindDto.LastChanceBroken:
      return t('lastChanceBroken', { achiever: other })
  }
}
