import type { TFunction } from 'i18next'
import { tDynamic } from '../i18n/useT'
import { RecentActionKindDto, type GameStateDto, type PlayerColorDto, type RecentActionDto } from '../types/GameState'
import type { PlayerDto } from '../types/Player'

/**
 * Eén regel uit het verloop in woorden, gedeeld door de TV-ticker (`ActionTicker`) en het tabblad
 * Spelverloop op de telefoon (`GameInfoHistory`), zodat beide exact dezelfde zin tonen. De zinnen
 * zelf staan in `actionTicker.ts`.
 */

export interface ActionActor {
  /** De speler die de actie uitvoert; `undefined` bij een actie zonder speler (de verdeling). */
  actor: PlayerDto | undefined
  /** Diens stoelkleur voor de avatar; `null` geeft de neutrale avatar. */
  color: PlayerColorDto | null
}

export function actionActor(action: RecentActionDto, state: GameStateDto): ActionActor {
  const actor = action.playerId ? state.players.find((player) => player.id === action.playerId) : undefined
  const color = actor ? (state.colors.find((c) => c.id === actor.colorId) ?? null) : null

  return { actor, color }
}

function playerName(state: GameStateDto, playerId: string | null): string {
  return state.players.find((player) => player.id === playerId)?.name ?? ''
}

function territoryName(territoryId: string | null): string {
  return territoryId ? tDynamic(territoryId, 'territories') : ''
}

function eventName(eventId: string | null): string {
  return eventId ? tDynamic(`${eventId}.name`, 'events') : ''
}

/** De zin na de spelernaam; bedragen, totalen en namen komen uit de DTO, nooit berekend. */
export function actionSentence(
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
    case RecentActionKindDto.EventDrawn:
      return t('eventDrawn', { event: eventName(action.eventId) })
    case RecentActionKindDto.ArmiesRemoved:
      return action.amount === 1
        ? t('armiesRemovedOne', { event: eventName(action.eventId) })
        : t('armiesRemoved', { count: action.amount, event: eventName(action.eventId) })
  }
}
