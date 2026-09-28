import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameInfoHistory } from './GameInfoHistory'
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
})

describe('GameInfoHistory', () => {
  it('toont het volledige verloop, ook meer dan de TV, met de nieuwste bovenaan', async () => {
    const newestFirst = Array.from({ length: 14 }, (_, index) => traded(14 - index))
    render(<GameInfoHistory state={fixtureState} loadActionLog={vi.fn().mockResolvedValue(newestFirst)} />)

    const rows = await screen.findAllByText(/legt kaarten in voor/)

    expect(rows).toHaveLength(14)
    expect(rows[0]).toHaveTextContent('legt kaarten in voor 14 legers')
    expect(rows[13]).toHaveTextContent('legt kaarten in voor 1 legers')
  })

  it('meldt het laden tot het verloop binnen is', () => {
    render(<GameInfoHistory state={fixtureState} loadActionLog={() => new Promise<RecentActionDto[]>(() => {})} />)

    expect(screen.getByText('Verloop laden…')).toBeInTheDocument()
  })

  it('meldt een leeg verloop', async () => {
    render(<GameInfoHistory state={fixtureState} loadActionLog={vi.fn().mockResolvedValue([])} />)

    expect(await screen.findByText('Nog geen acties.')).toBeInTheDocument()
  })

  it('meldt een fout als het verloop niet te laden is', async () => {
    render(<GameInfoHistory state={fixtureState} loadActionLog={vi.fn().mockRejectedValue(new Error('weg'))} />)

    expect(await screen.findByText('Het verloop kon niet worden geladen.')).toBeInTheDocument()
  })
})
