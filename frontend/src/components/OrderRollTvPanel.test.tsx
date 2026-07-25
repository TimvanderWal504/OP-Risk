import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrderRollTvPanel } from './OrderRollTvPanel'

const colors = [
  { id: 'red', name: 'Rood', hex: '#C0392B', onHex: '#FFFFFF', symbol: 'circle' },
  { id: 'blue', name: 'Blauw', hex: '#2980B9', onHex: '#FFFFFF', symbol: 'square' },
]

const players = [
  { id: '1', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false },
  { id: '2', name: 'Bob', colorId: 'blue', roleId: null, isHost: false, isEliminated: false },
]

describe('OrderRollTvPanel', () => {
  it('toont 2 dobbelstenen in de eigen spelerskleur voor een speler die al gegooid heeft', () => {
    render(<OrderRollTvPanel players={players} colors={colors} throws={{ '1': [6, 4] }} />)

    const dice = screen.getAllByRole('img', { name: /dobbelsteen/i })
    expect(dice).toHaveLength(2)
    expect(dice[0]).toHaveStyle({ background: '#C0392B' })
    expect(dice[1]).toHaveStyle({ background: '#C0392B' })
  })

  it('toont "Wacht op worp…" voor een speler die nog niet gegooid heeft', () => {
    render(<OrderRollTvPanel players={players} colors={colors} throws={{}} />)

    expect(screen.getAllByText('Wacht op worp…')).toHaveLength(2)
  })

  it('toont geen ranglijst zolang de server geen eindvolgorde aanlevert', () => {
    render(<OrderRollTvPanel players={players} colors={colors} throws={{}} />)

    expect(screen.queryByText('Speelvolgorde')).not.toBeInTheDocument()
  })

  it('toont de ranglijst met de winnaar bovenaan zodra order beschikbaar is', () => {
    render(<OrderRollTvPanel players={players} colors={colors} throws={{ '1': [6, 4], '2': [3, 2] }} order={['1', '2']} />)

    expect(screen.getByText('Speelvolgorde')).toBeInTheDocument()
    expect(screen.getAllByText('Alice')).toHaveLength(2)
    expect(screen.getAllByText('Bob')).toHaveLength(2)
  })
})
