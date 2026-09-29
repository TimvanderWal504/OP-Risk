import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { tDynamic } from '../i18n/useT'
import type { GameStateDto } from '../types/GameState'
import { latestEventDraw } from './latestEventDraw'
import { useToast } from './useToast'

/**
 * Telefoon: een korte, neutrale melding bij elke getrokken gebeurteniskaart (DESIGN.md § Event
 * Round). Alleen voor een trekking die deze telefoon ziet gebeuren — wat er bij het laden al stond,
 * is geen nieuws. Wie door de kaart meteen legers moet verwijderen, krijgt geen melding: dat scherm
 * noemt de kaart al (The Invisible Design Rule).
 */
export function useEventDrawNotice(state: GameStateDto | null, playerId: string | null): void {
  const { showInfo } = useToast()
  const { t } = useTranslation('eventPhone')
  // `undefined` = nog geen state gezien; `null` = gezien, nog nooit een trekking.
  const seenSequence = useRef<number | null | undefined>(undefined)
  const draw = latestEventDraw(state?.recentActions)
  const drawSequence = draw?.sequence ?? null
  const drawEventId = draw?.eventId ?? null
  const hasState = state !== null
  const pending = state?.pendingAttrition ?? null
  const mustChoose =
    drawEventId !== null && pending?.eventId === drawEventId && playerId !== null && pending.awaitingPlayerIds.includes(playerId)

  useEffect(() => {
    if (!hasState) return

    if (seenSequence.current === undefined) {
      seenSequence.current = drawSequence
      return
    }

    if (drawSequence === null || drawSequence === seenSequence.current) return

    seenSequence.current = drawSequence
    if (!mustChoose) showInfo(t('notice', { event: tDynamic(`${drawEventId}.name`, 'events') }))
  }, [hasState, drawSequence, drawEventId, mustChoose, showInfo, t])
}
