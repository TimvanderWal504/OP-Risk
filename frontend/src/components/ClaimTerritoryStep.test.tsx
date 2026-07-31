import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ClaimTerritoryStep } from './ClaimTerritoryStep'

const players = [
  { id: 'alice', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false },
  { id: 'bob', name: 'Bob', colorId: 'blue', roleId: null, isHost: false, isEliminated: false },
]

const colors = [
  { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' },
  { id: 'blue', name: 'Blauw', hex: '#2980b9', onHex: '#fff', symbol: 'square' },
]

const territoryCatalog = [
  { id: 'alaska', continent: 'north-america' },
  { id: 'brazil', continent: 'south-america' },
]

describe('ClaimTerritoryStep', () => {
  it('toont de vrije gebieden gegroepeerd per continent tijdens jouw beurt', () => {
    render(
      <ClaimTerritoryStep
        territories={[
          { territoryId: 'alaska', ownerPlayerId: null, armyCount: 0 },
          { territoryId: 'brazil', ownerPlayerId: null, armyCount: 0 },
        ]}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        activePlayerId="alice"
        playerId="alice"
        claimableTerritoryIds={['alaska', 'brazil']}
        onClaim={vi.fn()}
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.getByText('Brazilië')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^claim/i })).not.toBeInTheDocument()
  })

  it('roept onClaim pas aan na selecteren én bevestigen', async () => {
    const onClaim = vi.fn()
    render(
      <ClaimTerritoryStep
        territories={[{ territoryId: 'alaska', ownerPlayerId: null, armyCount: 0 }]}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        activePlayerId="alice"
        playerId="alice"
        claimableTerritoryIds={['alaska']}
        onClaim={onClaim}
      />,
    )

    await userEvent.click(screen.getByText('Alaska'))
    expect(onClaim).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /claim alaska/i }))
    expect(onClaim).toHaveBeenCalledWith('alaska')
  })

  it('toont de claimstand van iedereen als het niet jouw beurt is', () => {
    render(
      <ClaimTerritoryStep
        territories={[
          { territoryId: 'alaska', ownerPlayerId: 'bob', armyCount: 1 },
          { territoryId: 'brazil', ownerPlayerId: null, armyCount: 0 },
        ]}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        activePlayerId="bob"
        playerId="alice"
        claimableTerritoryIds={['brazil']}
        onClaim={vi.fn()}
      />,
    )

    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
    expect(screen.getByText('(jij)')).toBeInTheDocument()
    expect(screen.queryByText('Alaska')).not.toBeInTheDocument()
  })
})
