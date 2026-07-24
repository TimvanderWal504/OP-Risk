import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('toont de gegeven tekst', () => {
    render(<Badge>Wachtkamer</Badge>)
    expect(screen.getByText('Wachtkamer')).toBeInTheDocument()
  })
})
