import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerHeaderAction } from './ui/PlayerHeader'
import { PlayerHeader } from './ui/PlayerHeader'
import { MissionPanel } from './ui/MissionPanel'
import { MissionChangedNotice } from './ui/MissionChangedNotice'
import { CardsPanel } from './CardsPanel'
import { CardsIcon, InfoIcon, MissionIcon } from './ui/icons'
import { useMissionPanel } from '../hooks/useMissionPanel'
import { usePhoneHeaderTimer } from '../hooks/usePhoneHeaderTimer'
import { resolvePhoneHeaderStatus } from '../routes/phone/screens/resolvePhoneHeaderStatus'
import type { GameStateDto, GamePhaseDto as GamePhaseDtoType } from '../types/GameState'
import type { PlayerDto } from '../types/Player'

export interface PhonePlayerHeaderProps {
  state: GameStateDto
  me: PlayerDto
  /** `PhonePage.tsx`'s `displayPhase` — dezelfde vertraagde fase als voor de schermkeuze
   *  (`useHeldPhase`), zodat de header niet vooruitloopt op een scherm dat nog niet wisselt. */
  phase: GamePhaseDtoType
  /** Nodig omdat de header nu zelf een `CardsPanel`-instantie bezit (vrijwillige "Mijn
   *  kaarten"-toegang) — zelfde `useGameState`-functies als elk ander scherm ontvangt. */
  tradeInCards: (cardIds: string[]) => Promise<void>
  error: string | null
}

/**
 * Persistente telefoon-header (FO §2, §6.1) — gemount door `PhonePage.tsx` naast elk fase-
 * scherm, buiten de schermregistry om. Bundelt drie dingen die voorheen los stonden:
 * identiteit/timer/instellingen (`PlayerHeader`, tot nu toe nergens gemount), en de eigen
 * geheime missie (voorheen de floating `MissionAccess`-badge).
 *
 * **Mount-timing is doelbewust, niet toevallig — en gebeurt vóór dit component, in
 * `PhonePage.tsx`.** `PhonePage.tsx` rendert deze component pas zodra `resolvePhoneHeaderStatus`
 * niet-null teruggeeft, i.p.v. 'm altijd te renderen en hier intern `null` te laten teruggeven:
 * dat laatste zou de component al vanaf Lobby laten *bestaan* (React-hooks blijven leven achter
 * een `null`-return), dus `useMissionPanel`'s ref zou al initialiseren vóórdat `StartGame` de
 * missie toewijst — en de eerste toewijzing (`'' → id`) zou dan als een valse "missie
 * gewijzigd" binnenkomen. Met de mount zelf voorwaardelijk (niet alleen de output) is de
 * allereerste render hier altijd de al-toegewezen-of-nooit-missie, nooit de overgang zelf —
 * exact dezelfde garantie die de vroegere `MissionAccess` had via zijn eigen missionId-gated
 * mount. `useMissionPanel` mag de hook daarom onvoorwaardelijk aanroepen (nooit `null`, wel
 * eventueel `''` voor WorldDomination-potjes zonder missies).
 */
export function PhonePlayerHeader({ state, me, phase, tradeInCards, error }: PhonePlayerHeaderProps) {
  const { t } = useTranslation(['setup', 'reinforce', 'attack', 'fortify', 'common'])
  const color = state.colors.find((c) => c.id === me.colorId)
  const mission = useMissionPanel(me.missionId ?? '')
  const { timer, timerState } = usePhoneHeaderTimer(state.turnState?.timer ?? null)
  const [cardsOpen, setCardsOpen] = useState(false)

  const statusId = resolvePhoneHeaderStatus(phase, state.turnState?.turnPhase ?? null)

  // Geen kleur (zou betekenen: header gemount vóór de kleurkeuze rond is): niets tonen i.p.v.
  // een halve header — zelfde defensieve val-terug-patroon als `TvMainBoardScreen`'s
  // `if (!turnState) return null`. `!statusId` is hier vooral een tweede, verdedigende laag:
  // `PhonePage.tsx` mount dit component pas ná diezelfde check (zie de doc-comment hierboven).
  if (!color || !statusId) return null

  // Letterlijke colon-prefixed sleutels per tak (zelfde conventie als bv. `TvClaimingScreen`'s
  // `t('board:turnOf')`) i.p.v. een dynamisch samengestelde ns+key: die laatste vorm valt buiten
  // i18next's gegenereerde key-typing (elke ns heeft zijn eigen letterlijke sleutel-union).
  const status = (() => {
    switch (statusId) {
      case 'claiming':
        return t('setup:idle.claimingTerritories')
      case 'placingArmies':
        return t('setup:idle.placingArmies')
      case 'reinforce':
        return t('reinforce:kicker')
      case 'attack':
        return t('attack:bystander.subtitle')
      case 'fortify':
        return t('fortify:bystander.subtitle')
    }
  })()

  const myTerritoryIds = new Set(
    state.territories.filter((territory) => territory.ownerPlayerId === me.id).map((territory) => territory.territoryId),
  )
  const mustTradeInCards = state.turnState?.mustTradeInCards ?? false

  const actions: PlayerHeaderAction[] = [
    {
      icon: <CardsIcon className="h-[18px] w-[18px]" />,
      label: t('common:playerHeader.actions.cards'),
      onClick: () => setCardsOpen(true),
      active: cardsOpen,
      badgeCount: me.hand.length,
      badgeVariant: mustTradeInCards ? 'warning' : 'default',
    },
    {
      icon: <MissionIcon className="h-[18px] w-[18px]" />,
      label: t('common:playerHeader.actions.mission'),
      onClick: me.missionId ? mission.openPanel : undefined,
    },
    { icon: <InfoIcon className="h-[18px] w-[18px]" />, label: t('common:playerHeader.actions.info') },
  ]

  return (
    <>
      <PlayerHeader
        name={me.name}
        colorName={color.name}
        colorHex={color.hex}
        colorOnHex={color.onHex}
        colorSymbol={color.symbol}
        isHost={me.isHost}
        status={status}
        timer={timer}
        timerState={timerState}
        actions={actions}
      />
      {me.missionId && mission.changed && <MissionChangedNotice onDismiss={mission.dismissChanged} />}
      {me.missionId && mission.open && <MissionPanel missionId={me.missionId} onClose={mission.closePanel} />}
      {cardsOpen && (
        <CardsPanel
          hand={me.hand}
          myTerritoryIds={myTerritoryIds}
          mustTradeInCards={false}
          initialMode="browse"
          onTradeInCards={tradeInCards}
          onClose={() => setCardsOpen(false)}
          error={error}
        />
      )}
    </>
  )
}
