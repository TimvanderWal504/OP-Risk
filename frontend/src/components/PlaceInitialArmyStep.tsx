import { useTranslation } from 'react-i18next'
import type { PlayerColorDto, TerritoryDto } from '../types/GameState'
import { ArmyStepperRow } from './ui/ArmyStepperRow'
import { StatHeaderCard } from './ui/StatHeaderCard'
import { tDynamic } from '../i18n/useT'

export interface PlaceInitialArmyStepProps {
  myTerritories: TerritoryDto[]
  myColor: PlayerColorDto | null
  armiesLeft: number
  onPlace: (territoryId: string) => void
}

/**
 * Startopstelling · Legers plaatsen (`isSetup`-fase in het oorspronkelijke design): lijst van eigen
 * gebieden met een +-knop per rij, via de gedeelde `ArmyStepperRow` (`incrementOnly`, zie
 * de doc-comment daar voor waarom setup geen decrement heeft). `setupAddBg`/`setupCursor`
 * volgen uit `armiesLeft > 0` (L1701-1702) — bij 0 is de knop uitgeschakeld i.p.v. verborgen
 * (fase rondt zelf af via de server zodra iedereen klaar is).
 */
export function PlaceInitialArmyStep({
  myTerritories,
  myColor,
  armiesLeft,
  onPlace,
}: PlaceInitialArmyStepProps) {
  const { t } = useTranslation('setup')
  const canPlace = armiesLeft > 0

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4">
      <StatHeaderCard
        kicker={t('place.kicker')}
        title={t('place.title')}
        statValue={armiesLeft}
        statLabel={t('place.armiesLeft')}
        paddingY={12}
      />
      <div className="mt-3 mb-2 font-body text-[13px] text-fg-muted">{t('place.hint')}</div>
      <div className="flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto">
        {myTerritories.map((territory) => (
          <ArmyStepperRow
            key={territory.territoryId}
            incrementOnly
            color={myColor}
            label={tDynamic(territory.territoryId, 'territories')}
            armyCount={territory.armyCount}
            canIncrement={canPlace}
            onIncrement={() => onPlace(territory.territoryId)}
          />
        ))}
      </div>
    </div>
  )
}
