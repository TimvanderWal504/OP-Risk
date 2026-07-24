import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvPageHeader } from './TvPageHeader'

describe('TvPageHeader', () => {
  it('toont de branding en de gegeven badge', () => {
    render(<TvPageHeader badge="Wachtkamer" />)

    expect(screen.getByText('OPERATIE ATLAS')).toBeInTheDocument()
    expect(screen.getByText('CAMPAGNE-TERMINAL')).toBeInTheDocument()
    expect(screen.getByText('Wachtkamer')).toBeInTheDocument()
  })
})
