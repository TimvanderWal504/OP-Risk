import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlayerMissionReveal } from './PlayerMissionReveal'

const color = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#ffffff', symbol: 'circle' }

describe('PlayerMissionReveal', () => {
  it('toont naam en badge zonder missietekst wanneer geen missionId is opgegeven', () => {
    render(<PlayerMissionReveal playerName="Alice" color={color} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Bezit 24 gebieden', { exact: false })).not.toBeInTheDocument()
  })

  it('toont naam, badge en de onthulde missietekst wanneer missionId is opgegeven', () => {
    render(<PlayerMissionReveal playerName="Alice" color={color} missionId="territory-24" />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bezit 24 gebieden', { exact: false })).toBeInTheDocument()
    expect(
      screen.getByText('Bezit op enig moment 24 gebieden, ongeacht welke.', { exact: false }),
    ).toBeInTheDocument()
  })

  it('toont geen badge als color null is', () => {
    render(<PlayerMissionReveal playerName="Alice" color={null} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('toont geen voltooid/niet-gehaald-badge wanneer completed niet is opgegeven', () => {
    render(<PlayerMissionReveal playerName="Alice" color={color} missionId="territory-24" />)

    expect(screen.queryByText('Voltooid')).not.toBeInTheDocument()
    expect(screen.queryByText('Niet gehaald')).not.toBeInTheDocument()
  })

  it('toont een "Voltooid"-badge wanneer completed true is', () => {
    render(<PlayerMissionReveal playerName="Alice" color={color} missionId="territory-24" completed />)

    expect(screen.getByText('Voltooid')).toBeInTheDocument()
  })

  it('toont een "Niet gehaald"-badge wanneer completed false is', () => {
    render(<PlayerMissionReveal playerName="Alice" color={color} missionId="territory-24" completed={false} />)

    expect(screen.getByText('Niet gehaald')).toBeInTheDocument()
  })
})
