import { useTranslation } from 'react-i18next'
import type { CardDto } from '../../types/Card'
import { GlassPanel } from './GlassPanel'
import { ArtilleryIcon, CavalryIcon, InfantryIcon, JokerIcon, type IconProps } from './icons'
import { resolveCardTheme } from '../../config/resolveCardTheme'
import { tDynamic } from '../../i18n/useT'

export interface TerritoryCardTileProps {
  card: CardDto
  /** Of `card.territoryId` een gebied van de eigen speler is (FO §4.4, +2-bezitsbonus). */
  owned: boolean
}

const SYMBOL_ICONS: Record<string, (props: IconProps) => ReturnType<typeof InfantryIcon>> = {
  'symbol-1': InfantryIcon,
  'symbol-2': CavalryIcon,
  'symbol-3': ArtilleryIcon,
  joker: JokerIcon,
}

/**
 * Eén territoriumkaart, presentational (geen eigen selectie-state) — passief in het
 * hand-overzicht, of als `children` van `SelectableOption` in de inleg-stap (design-brief,
 * "Eén tegel, twee gebruiken"). Rendert binnen `CardsPanel`'s `ModalShell`, dus de
 * `GlassPanel` hieronder vervaagt flat via de no-nested-blur-guard (zelfde pad als
 * `MissionPanel`'s eigen `GlassPanel`).
 */
export function TerritoryCardTile({ card, owned }: TerritoryCardTileProps) {
  const { t } = useTranslation('cardsPanel')
  const Icon = SYMBOL_ICONS[card.symbol] ?? InfantryIcon
  const symbolLabel = tDynamic(`${resolveCardTheme()}.${card.symbol}`, 'cards')
  const territoryLabel = card.territoryId ? tDynamic(card.territoryId, 'territories') : t('jokerLabel')

  return (
    <GlassPanel
      elevation="raised"
      context="phone"
      className="flex flex-col gap-2 text-left"
      style={owned ? { borderColor: 'var(--pitch-700)' } : undefined}
    >
      <span className="flex items-center gap-1.5 font-body text-xs font-extrabold tracking-[.12em] text-fg-muted uppercase">
        <Icon className="h-4 w-4" />
        {symbolLabel}
      </span>
      <span className="font-display text-h3 font-semibold text-fg">{territoryLabel}</span>
      {owned && <span className="text-xs text-fg-secondary">{t('ownedTerritory')}</span>}
    </GlassPanel>
  )
}
