import { useTranslation } from 'react-i18next'
import type { PlayerColorDto, TerritoryDto } from '../types/GameState'
import { ArmyStepperRow } from './ui/ArmyStepperRow'
import { StatHeaderCard } from './ui/StatHeaderCard'
import { tDynamic } from '../i18n/useT'
import { PhoneScreen } from './ui/PhoneScreen'

export interface PlaceInitialArmyStepProps {
  myTerritories: TerritoryDto[]
  myColor: PlayerColorDto | null
  armiesLeft: number
  onPlace: (territoryId: string) => void
}

/**
 * Startopstelling · Legers plaatsen: lijst van eigen gebieden met een +-knop per rij via
 * `ArmyStepperRow` (`incrementOnly` — zie de doc-comment daar voor de reden). De knop is
 * uitgeschakeld bij `armiesLeft === 0` i.p.v. verborgen; de fase rondt zelf af via de server.
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
    <PhoneScreen>
      <StatHeaderCard
        title={t('place.title')}
        statValue={armiesLeft}
        statLabel={t('place.armiesLeft')}
        paddingY={12}
        hint={t('place.hint')}
      />
      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-[9px] overflow-y-auto">
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
    </PhoneScreen>
  )
}
