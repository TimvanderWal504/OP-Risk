import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvTitleColumn } from './TvTitleColumn'

describe('TvTitleColumn', () => {
  it('toont de kicker, de titel en de wachtregel', () => {
    render(<TvTitleColumn badge="TV koppelen" status="Wachten op de host…" />)

    expect(screen.getByText('TV koppelen')).toBeInTheDocument()
    expect(screen.getByText('OPERATIE')).toBeInTheDocument()
    expect(screen.getByText('Wachten op de host…')).toBeInTheDocument()
  })
})
