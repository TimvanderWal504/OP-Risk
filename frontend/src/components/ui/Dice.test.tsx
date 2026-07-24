import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dice } from './Dice'

describe('Dice', () => {
  it('geeft de waarde als toegankelijke naam', () => {
    render(<Dice value={5} />)
    expect(screen.getByRole('img', { name: 'Dobbelsteen 5' })).toBeInTheDocument()
  })
})
