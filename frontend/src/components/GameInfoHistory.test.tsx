import type { ReactElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameInfoHistory } from './GameInfoHistory'
import { ToastProvider } from '../hooks/ToastProvider'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'
import { RecentActionKindDto, type RecentActionDto } from '../types/GameState'

const traded = (sequence: number): RecentActionDto => ({
  sequence,
  kind: RecentActionKindDto.CardsTraded,
  playerId: fixtureState.players[0].id,
  otherPlayerId: null,
  territoryId: null,
  fromTerritoryId: null,
  amount: sequence,
  total: null,
  attackerLosses: null,
  defenderLosses: null,
  eventId: null,
  eventBonus: null,
})

// Een laadfout wordt een toast; daarvoor is de provider nodig.
const renderWithToasts = (ui: ReactElement) => render(<ToastProvider device="phone">{ui}</ToastProvider>)

describe('GameInfoHistory', () => {
  it('toont het volledige verloop, ook meer dan de TV, met de nieuwste bovenaan', async () => {
    const newestFirst = Array.from({ length: 14 }, (_, index) => traded(14 - index))
    renderWithToasts(<GameInfoHistory state={fixtureState} loadActionLog={vi.fn().mockResolvedValue(newestFirst)} />)

    const rows = await screen.findAllByText(/legt kaarten in voor/)

    expect(rows).toHaveLength(14)
    expect(rows[0]).toHaveTextContent('legt kaarten in voor 14 legers')
    expect(rows[13]).toHaveTextContent('legt kaarten in voor 1 legers')
  })

  it('meldt het laden tot het verloop binnen is', () => {
    renderWithToasts(<GameInfoHistory state={fixtureState} loadActionLog={() => new Promise<RecentActionDto[]>(() => {})} />)

    expect(screen.getByText('Verloop laden…')).toBeInTheDocument()
  })

  it('meldt een leeg verloop', async () => {
    renderWithToasts(<GameInfoHistory state={fixtureState} loadActionLog={vi.fn().mockResolvedValue([])} />)

    expect(await screen.findByText('Nog geen acties.')).toBeInTheDocument()
  })

  it('meldt een laadfout als toast en toont dan stil het korte verloop uit de state', async () => {
    const state = { ...fixtureState, recentActions: [traded(3), traded(2)] }
    renderWithToasts(<GameInfoHistory state={state} loadActionLog={vi.fn().mockRejectedValue(new Error('weg'))} />)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Het verloop kon niet worden geladen.'))
    const rows = screen.getAllByText(/legt kaarten in voor/)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('legt kaarten in voor 3 legers')
  })
})
