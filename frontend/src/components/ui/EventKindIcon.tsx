import { EventEffectKindDto } from '../../types/GameState'
import { EventArmyLossIcon, EventBonusIcon, EventCardIcon, EventSeaBlockadeIcon, LockIcon, type IconProps } from './icons'

export interface EventKindIconProps extends IconProps {
  kind: EventEffectKindDto
}

const ICONS: Record<EventEffectKindDto, (props: IconProps) => React.ReactElement> = {
  [EventEffectKindDto.Bonus]: EventBonusIcon,
  [EventEffectKindDto.SeaBlockade]: EventSeaBlockadeIcon,
  [EventEffectKindDto.TerritoryLock]: LockIcon,
  [EventEffectKindDto.Attrition]: EventArmyLossIcon,
  [EventEffectKindDto.Other]: EventCardIcon,
}

/**
 * Het lijn-icoon voor de soort gevolg van een gebeurteniskaart (DESIGN.md § Event Round). De soort
 * komt van de server; een onbekende soort (versie-skew) valt terug op het algemene kaart-icoon.
 */
export function EventKindIcon({ kind, className }: EventKindIconProps) {
  const Icon = ICONS[kind] ?? EventCardIcon

  return <Icon className={className} />
}
