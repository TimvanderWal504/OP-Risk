import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LobbyPlayerList } from './LobbyPlayerList'

const colors = [{ id: 'red', name: 'Rood', hex: '#C0392B', symbol: 'circle' }]

describe('LobbyPlayerList', () => {
  it('toont spelers en het aantal wacht-slots tot maxPlayers', () => {
    render(
      <LobbyPlayerList
        players={[
          { id: '1', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false },
        ]}
        colors={colors}
        roles={[]}
        maxPlayers={3}
      />,
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Rood')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getAllByText('Wachten op speler')).toHaveLength(2)
  })
})
