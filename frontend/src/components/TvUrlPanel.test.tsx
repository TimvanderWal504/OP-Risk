import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvUrlPanel } from './TvUrlPanel'

describe('TvUrlPanel', () => {
  it('toont de tv-url voor de opgegeven gameId', () => {
    render(<TvUrlPanel gameId="ABC123" origin="https://atlas.example" />)

    expect(screen.getByText('https://atlas.example/tv/ABC123')).toBeInTheDocument()
  })
})
