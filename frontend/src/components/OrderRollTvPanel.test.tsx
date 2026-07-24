import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrderRollTvPanel } from './OrderRollTvPanel'

const colors = [
  { id: 'red', name: 'Rood', hex: '#C0392B', symbol: 'circle' },
  { id: 'blue', name: 'Blauw', hex: '#2980B9', symbol: 'square' },
]

const players = [
  { id: '1', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false },
  { id: '2', name: 'Bob', colorId: 'blue', roleId: null, isHost: false, isEliminated: false },
]

describe('OrderRollTvPanel', () => {
  it('toont de laatste worp en het totaal voor een speler die al gegooid heeft', () => {
    render(<OrderRollTvPanel players={players} colors={colors} throws={{ '1': [6, 4] }} />)

    expect(screen.getByText('Totaal: 10')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /dobbelsteen/i })).toHaveLength(2)
  })

  it('toont "Wacht op worp…" voor een speler die nog niet gegooid heeft', () => {
    render(<OrderRollTvPanel players={players} colors={colors} throws={{}} />)

    expect(screen.getAllByText('Wacht op worp…')).toHaveLength(2)
  })
})
