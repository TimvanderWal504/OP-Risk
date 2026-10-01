import { createElement, type ReactNode } from 'react'
import { renderHook, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GamePhaseDto, RecentActionKindDto, type GameStateDto, type RecentActionDto } from '../types/GameState'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'
import { ToastProvider } from './ToastProvider'
import { useHostTransferNotice } from './useHostTransferNotice'

const transferredTo = (playerId: string, sequence: number): RecentActionDto => ({
  sequence,
  kind: RecentActionKindDto.HostTransferred,
  playerId,
  otherPlayerId: 'carol',
  territoryId: null,
  fromTerritoryId: null,
  amount: null,
  total: null,
  attackerLosses: null,
  defenderLosses: null,
  eventId: null,
  eventBonus: null,
  cardsTradedInTurn: false,
})

const withLog = (recentActions: RecentActionDto[]): GameStateDto => ({
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  recentActions,
})

const wrapper = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device: 'phone', children })

describe('useHostTransferNotice', () => {
  it('meldt de nieuwe host een overdracht die zijn telefoon ziet gebeuren', () => {
    const { rerender } = renderHook(({ state }) => useHostTransferNotice(state, 'alice'), {
      wrapper,
      initialProps: { state: withLog([]) },
    })

    rerender({ state: withLog([transferredTo('alice', 7)]) })

    expect(screen.getByRole('status')).toHaveTextContent('Je bent nu host')
  })

  it('meldt niet wat er bij het laden al stond', () => {
    renderHook(() => useHostTransferNotice(withLog([transferredTo('alice', 7)]), 'alice'), { wrapper })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('meldt niets aan wie geen host werd', () => {
    const { rerender } = renderHook(({ state }) => useHostTransferNotice(state, 'bob'), {
      wrapper,
      initialProps: { state: withLog([]) },
    })

    rerender({ state: withLog([transferredTo('alice', 7)]) })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
