import { createElement, type ReactNode } from 'react'
import { renderHook, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GamePhaseDto, RecentActionKindDto, type GameStateDto, type RecentActionDto } from '../types/GameState'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'
import { ToastProvider } from './ToastProvider'
import { useEventDrawNotice } from './useEventDrawNotice'

const drawn = (eventId: string, sequence: number): RecentActionDto => ({
  sequence,
  kind: RecentActionKindDto.EventDrawn,
  playerId: null,
  otherPlayerId: null,
  territoryId: null,
  fromTerritoryId: null,
  amount: null,
  total: null,
  attackerLosses: null,
  defenderLosses: null,
  eventId,
  eventBonus: null, cardsTradedInTurn: false,
})

const withLog = (recentActions: RecentActionDto[], overrides: Partial<GameStateDto> = {}): GameStateDto => ({
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  recentActions,
  ...overrides,
})

const wrapper = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device: 'phone', children })

describe('useEventDrawNotice', () => {
  it('meldt een trekking die de telefoon ziet gebeuren, neutraal', () => {
    const { rerender } = renderHook(({ state }) => useEventDrawNotice(state, 'alice'), {
      wrapper,
      initialProps: { state: withLog([]) },
    })

    rerender({ state: withLog([drawn('babyboom', 5)]) })

    expect(screen.getByRole('status')).toHaveTextContent('Gebeurteniskaart: Babyboom')
  })

  it('meldt niet wat er bij het laden al stond', () => {
    renderHook(() => useEventDrawNotice(withLog([drawn('babyboom', 5)]), 'alice'), { wrapper })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('meldt niets aan wie door de kaart meteen legers moet verwijderen', () => {
    const { rerender } = renderHook(({ state }) => useEventDrawNotice(state, 'alice'), {
      wrapper,
      initialProps: { state: withLog([]) },
    })

    rerender({
      state: withLog([drawn('griepgolf', 5)], {
        pendingAttrition: { eventId: 'griepgolf', amount: 2, chooserPlayerIds: ['alice'], awaitingPlayerIds: ['alice'] },
      }),
    })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
