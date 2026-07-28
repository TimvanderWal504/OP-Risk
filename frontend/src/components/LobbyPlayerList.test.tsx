import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LobbyPlayerList } from './LobbyPlayerList'
import { tvAnimations } from '../design-reference/shared/motion'

const colors = [{ id: 'red', name: 'Rood', hex: '#C0392B', onHex: '#FFFFFF', symbol: 'circle' }]
const roles = [{ id: 'president', name: 'President', description: '', originTerritory: 'eastern-united-states' }]

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

  it('geeft een spelerskaart de entrance-animatie uit het design (motion.ts A4)', () => {
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

    expect(screen.getByText('Alice').closest('div[style]')).toHaveStyle({
      animation: tvAnimations.lobbyCardIn,
    })
  })

  it('geeft een bijkomende rol op een bestaande kaart zijn eigen entrance-animatie', () => {
    render(
      <LobbyPlayerList
        players={[
          { id: '1', name: 'Alice', colorId: 'red', roleId: 'president', isHost: true, isEliminated: false },
        ]}
        colors={colors}
        roles={roles}
        maxPlayers={3}
      />,
    )

    const roleSpan = screen.getByText(/president/i)
    expect(roleSpan).toHaveStyle({ animation: tvAnimations.lobbyRoleIn })
  })
})
