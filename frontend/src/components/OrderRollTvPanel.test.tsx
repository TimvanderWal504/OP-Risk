import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrderRollTvPanel } from './OrderRollTvPanel'
import { tvAnimations } from '../styles/motion'
import { expectedColorMixBorder } from '../test/cssColorMix'

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
    expect(dice[0].style.border).toBe(expectedColorMixBorder('#C0392B'))
    expect(dice[1].style.border).toBe(expectedColorMixBorder('#C0392B'))
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

  it('gebruikt de in-place herworp-animatie i.p.v. de mount-only entrance zodra een speler die al gooide nieuwe waarden krijgt (tie-break)', () => {
    const { rerender } = render(<OrderRollTvPanel players={players} colors={colors} throws={{ '1': [6, 4], '2': [3, 2] }} />)

    // De `animation` staat op de niet-filterende buiten-`<div>` rond het `role="img"`-element,
    // niet op het gefilterde element zelf (Dice.tsx, BEVINDING 2026-08-10: backdrop-filter +
    // animation op hetzelfde element herrekent niet consequent op WebKit/iOS Safari).
    let dice = screen.getAllByRole('img', { name: /dobbelsteen/i })
    expect(dice[0].parentElement).toHaveStyle({ animation: tvAnimations.orderRollDie(0) })

    rerender(<OrderRollTvPanel players={players} colors={colors} throws={{ '1': [5, 5], '2': [3, 2] }} />)

    dice = screen.getAllByRole('img', { name: /dobbelsteen/i })
    expect(dice[0].parentElement).toHaveStyle({ animation: tvAnimations.diceRerollOrder })
    expect(dice[1].parentElement).toHaveStyle({ animation: tvAnimations.diceRerollOrder })
    expect(dice[2].parentElement).toHaveStyle({ animation: tvAnimations.orderRollDie(1) })
  })
})
