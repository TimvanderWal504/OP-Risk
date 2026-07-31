import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PhonePlaceholderScreen } from './PhonePlaceholderScreen'

describe('PhonePlaceholderScreen', () => {
  it('toont dat deze fase nog geen scherm heeft in plaats van niets', () => {
    render(<PhonePlaceholderScreen />)

    expect(screen.getByText(/spelbord volgt in een latere bouwplak/i)).toBeInTheDocument()
  })
})
