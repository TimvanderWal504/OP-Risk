import { useTranslation } from 'react-i18next'
import type { PlayerColorDto, TerritoryDto } from '../types/GameState'
import { ColorAvatar } from './ui/ColorAvatar'
import { StatHeaderCard } from './ui/StatHeaderCard'
import { tDynamic } from '../i18n/useT'

export interface PlaceInitialArmyStepProps {
  myTerritories: TerritoryDto[]
  myColor: PlayerColorDto | null
  armiesLeft: number
  onPlace: (territoryId: string) => void
}

/**
 * Startopstelling · Legers plaatsen (Telefoon.dc.html L450-469, `isSetup`): lijst van eigen
 * gebieden met een +-knop per rij. `setupAddBg`/`setupCursor` volgen uit `armiesLeft > 0`
 * (L1701-1702) — bij 0 is de knop uitgeschakeld i.p.v. verborgen (fase rondt zelf af via de
 * server zodra iedereen klaar is).
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
          <div
            key={territory.territoryId}
            className="flex items-center gap-3 rounded-[14px] border border-border bg-[var(--atlas-t04)] px-3 py-[9px]"
          >
            <ColorAvatar color={myColor} variant="row" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[16px] font-extrabold">
                {tDynamic(territory.territoryId, 'territories')}
              </div>
            </div>
            <span className="min-w-[30px] text-right font-display text-[22px] font-black tabular-nums">
              {territory.armyCount}
            </span>
            <button
              type="button"
              disabled={!canPlace}
              onClick={() => onPlace(territory.territoryId)}
              className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl font-display text-2xl font-black text-[var(--on-pitch)] disabled:cursor-not-allowed"
              style={{ background: canPlace ? 'var(--pitch-500)' : 'var(--border-strong)' }}
            >
              {'+'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
