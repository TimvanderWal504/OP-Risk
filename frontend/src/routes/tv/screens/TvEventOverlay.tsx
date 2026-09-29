import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Badge } from '../../../components/ui/Badge'
import { ColorAvatar } from '../../../components/ui/ColorAvatar'
import { EventKindIcon } from '../../../components/ui/EventKindIcon'
import { GlassPanel } from '../../../components/ui/GlassPanel'
import { CheckIcon } from '../../../components/ui/icons'
import { ModalShell } from '../../../components/ui/ModalShell'
import { tDynamic } from '../../../i18n/useT'
import { eventRoundTok } from '../../../styles/design-tokens'
import { tvAnimations } from '../../../styles/motion'
import { useTvDisplayScale } from '../../../hooks/useTvDisplayScale'
import type { GameStateDto } from '../../../types/GameState'
import { EventDurationDto, EventEffectKindDto, RecentActionKindDto } from '../../../types/GameState'
import type { HeldEvent } from '../../../hooks/useHeldEvent'
import type { TvScreenProps } from './tvScreens'

/**
 * De gebeurteniskaart op de TV (C10, DESIGN.md § Event Round): scrim over het bord, daarop de kaart
 * — kicker, lijn-icoon per soort gevolg, naam, omschrijving, duur-badge en één gevolg-regel. Bij
 * legerverlies staat eronder de wachtstaat ("Nog N van M spelers kiezen" + kiezer-avatars). Welke
 * kaart, welke soort en wie wat kreeg, komt allemaal van de server; hier wordt niets afgeleid.
 */
export function TvEventOverlay({ state, event }: TvScreenProps) {
  const { t, i18n } = useTranslation('eventTv')
  const textScale = useTvDisplayScale().text

  const pending = state.pendingAttrition
  const eventId = pending?.eventId ?? event?.eventId
  const summary = state.events.find((candidate) => candidate.id === eventId)
  // `resolveTvOverlay` mount dit alleen met een kaart of lopende keuzes; puur voor de typechecker.
  if (!eventId || !summary) return null

  const list = new Intl.ListFormat(i18n.language, { type: 'conjunction' })
  const consequence = consequenceLine(state, event ?? null, summary.effectKind, summary.amount, t, list)

  return (
    <ModalShell
      context="tv"
      animated
      className="absolute inset-0 flex items-center justify-center"
      style={{ borderRadius: 0, animation: tvAnimations.overlayIn }}
    >
      <GlassPanel
        elevation="raised"
        context="tv"
        padding="none"
        animated
        className="relative flex flex-col items-center overflow-hidden rounded-sheet px-12 py-11 text-center"
        style={{ width: eventRoundTok.cardWidthPx * textScale, animation: tvAnimations.cardReveal }}
      >
        {/* Eén glans over de kaart bij het onthullen; transform-only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-2/5"
          style={{
            background: eventRoundTok.cardSheenGradient,
            animation: tvAnimations.cardSheenOnce,
          }}
        />
        <span className="font-body text-label font-extrabold uppercase tracking-[.24em] text-silver-400">{t('kicker')}</span>
        <EventKindIcon kind={summary.effectKind} className="mt-3.5 mb-1.5 h-[1em] w-[1em] text-size12 text-fg" />
        <h1 className="m-0 mb-3.5 font-display text-size11 font-black leading-none tracking-[-.01em] text-fg">
          {tDynamic(`${eventId}.name`, 'events')}
        </h1>
        <p className="m-0 max-w-[600px] font-body text-size6 leading-[1.4] text-fg-secondary">
          {tDynamic(`${eventId}.description`, 'events')}
        </p>
        <div className="mt-6">
          <Badge>{t(summary.duration === EventDurationDto.OneRound ? 'duration.oneRound' : 'duration.instant')}</Badge>
        </div>
        {consequence && <div className="mt-4 font-body text-size4 font-extrabold text-fg-secondary">{consequence}</div>}

        {pending && pending.eventId === eventId && <AttritionWait state={state} t={t} />}
      </GlassPanel>
    </ModalShell>
  )
}

/** "Nog N van M spelers kiezen" en een avatar per kiezer, met een vinkje wie al koos. */
function AttritionWait({ state, t }: { state: GameStateDto; t: TFunction<'eventTv'> }) {
  const pending = state.pendingAttrition!

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="font-display text-size5 font-extrabold tabular-nums text-fg">
        {t('waiting', { waiting: pending.awaitingPlayerIds.length, total: pending.chooserPlayerIds.length })}
      </div>
      <div className="flex gap-3.5">
        {pending.chooserPlayerIds.map((playerId) => {
          const player = state.players.find((candidate) => candidate.id === playerId)
          const color = state.colors.find((candidate) => candidate.id === player?.colorId)
          const done = !pending.awaitingPlayerIds.includes(playerId)

          return (
            <div key={playerId} className="relative" data-testid="attrition-chooser" data-done={done}>
              <ColorAvatar color={color} variant="banner" />
              {done && (
                <span className="absolute -right-1.5 -bottom-1.5 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-silver-400 text-fg-onbrand">
                  <CheckIcon className="h-4 w-4" />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * De ene regel met het gevolg. Bonus: de ontvangers uit het verloop van déze trekking (vanaf het
 * volgnummer van de trekking), zodat een speler die intussen al aan de beurt was niet van de kaart
 * verdwijnt. Afgesloten gebieden: uit het lopende effect. Legerverlies: het bedrag uit de catalogus.
 */
function consequenceLine(
  state: GameStateDto,
  event: HeldEvent | null,
  kind: EventEffectKindDto,
  amount: number | null,
  t: TFunction<'eventTv'>,
  list: Intl.ListFormat,
): string | null {
  switch (kind) {
    case EventEffectKindDto.Bonus: {
      if (!event) return null
      const lines = state.recentActions.filter(
        (action) =>
          action.kind === RecentActionKindDto.EventBonusGranted &&
          action.eventId === event.eventId &&
          action.sequence > event.sequence,
      )
      if (lines.length === 0) return t('consequence.bonusNobody')
      const bonus = lines[0].amount ?? 0
      if (lines.some((line) => line.playerId === null)) return t('consequence.bonusEveryone', { amount: bonus })
      const names = list.format(
        lines
          .slice()
          .reverse()
          .map((line) => state.players.find((player) => player.id === line.playerId)?.name ?? ''),
      )
      return t(lines.length === 1 ? 'consequence.bonusOne' : 'consequence.bonusSome', { names, amount: bonus })
    }
    case EventEffectKindDto.SeaBlockade:
      return t('consequence.seaBlockade')
    case EventEffectKindDto.TerritoryLock: {
      const locked = state.activeEffect?.lockedTerritoryIds ?? []
      if (locked.length === 0) return null
      return t('consequence.territoryLock', { territories: list.format(locked.map((id) => tDynamic(id, 'territories'))) })
    }
    case EventEffectKindDto.Attrition:
      return amount === null ? null : t('consequence.attrition', { count: amount })
    default:
      return null
  }
}
