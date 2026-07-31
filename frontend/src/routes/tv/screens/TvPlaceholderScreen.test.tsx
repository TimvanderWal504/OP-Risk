import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvPlaceholderScreen } from './TvPlaceholderScreen'

describe('TvPlaceholderScreen', () => {
  it('toont dat deze fase nog geen host-scherm heeft in plaats van niets', () => {
    render(<TvPlaceholderScreen />)

    expect(screen.getByText(/bord volgt in een latere bouwplak/i)).toBeInTheDocument()
  })
})
