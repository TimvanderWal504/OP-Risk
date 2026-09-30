import { useTranslation } from 'react-i18next'
import { tDynamic } from '../i18n/useT'
import type { GameStateDto } from '../types/GameState'
import { EventEffectKindDto } from '../types/GameState'
import { Badge } from './ui/Badge'
import { EventKindIcon } from './ui/EventKindIcon'
import { GlassPanel } from './ui/GlassPanel'

export interface ActiveEffectChipProps {
  state: GameStateDto
}

/**
 * Het ronde-effect dat nu geldt, onderaan het TV-bord onder zuidelijk Afrika (DESIGN.md § Event Round). Er is er
 * hoogstens één; zonder lopend effect rendert er niets (The Invisible Design Rule). Tekst uit de
 * type-schaal, zodat de chip meeschaalt met de tekstinstelling van de host.
 */
export function ActiveEffectChip({ state }: ActiveEffectChipProps) {
  const { t } = useTranslation('eventTv')
  const effect = state.activeEffect
  if (!effect) return null

  const kind = state.events.find((event) => event.id === effect.eventId)?.effectKind ?? EventEffectKindDto.Other

  return (
    <GlassPanel elevation="base" context="tv" padding="none" className="flex items-center gap-3 px-4 py-3">
      <EventKindIcon kind={kind} className="h-[1em] w-[1em] flex-none text-size8 text-fg" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-body text-label font-extrabold uppercase tracking-[.1em] text-fg-muted">{t('chipKicker')}</span>
        <span className="truncate font-display text-size5 font-extrabold leading-none text-fg">
          {tDynamic(`${effect.eventId}.name`, 'events')}
        </span>
      </div>
      <Badge>{t('chipUntil')}</Badge>
    </GlassPanel>
  )
}
