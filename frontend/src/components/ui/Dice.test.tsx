import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dice } from './Dice'

describe('Dice', () => {
  it('geeft de waarde als toegankelijke naam', () => {
    render(
      <Dice value={5} colorHex="#0057ff" colorOnHex="#f8f7f4" size={104} radius={22} padding={15} gap={6} pipSize={17} boxShadow="none" />,
    )
    expect(screen.getByRole('img', { name: 'Dobbelsteen 5' })).toBeInTheDocument()
  })

  it('gebruikt de meegegeven spelerskleur voor achtergrond en pips', () => {
    render(
      <Dice value={1} colorHex="#ca3c25" colorOnHex="#fffbbd" size={104} radius={22} padding={15} gap={6} pipSize={17} boxShadow="none" />,
    )
    const die = screen.getByRole('img', { name: 'Dobbelsteen 1' })
    expect(die).toHaveStyle({ background: '#ca3c25' })
    expect(die.querySelector('span > span')).toHaveStyle({ background: '#fffbbd' })
  })
})
