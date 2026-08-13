import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dice } from './Dice'
import { dicePip } from '../../styles/glass-tokens'
import { expectedColorMixBorder } from '../../test/cssColorMix'

describe('Dice', () => {
  it('geeft de waarde als toegankelijke naam', () => {
    render(<Dice value={5} colorHex="#0057ff" context="tv" size={104} radius={22} padding={15} gap={6} pipSize={17} />)
    expect(screen.getByRole('img', { name: 'Dobbelsteen 5' })).toBeInTheDocument()
  })

  it('kleurt de rand met de solide spelerskleur op 60% alpha', () => {
    render(<Dice value={1} colorHex="#ca3c25" context="tv" size={104} radius={22} padding={15} gap={6} pipSize={17} />)
    const die = screen.getByRole('img', { name: 'Dobbelsteen 1' })
    expect(die.style.border).toBe(expectedColorMixBorder('#ca3c25'))
  })

  it('gebruikt de constante, volledig ondoorzichtige dice.pip-kleur voor elke pip, ongeacht de spelerskleur', () => {
    render(<Dice value={1} colorHex="#ca3c25" context="tv" size={104} radius={22} padding={15} gap={6} pipSize={17} />)
    const die = screen.getByRole('img', { name: 'Dobbelsteen 1' })
    expect(die.querySelector('span > span')).toHaveStyle({ background: dicePip.fill })
  })

  it('valt terug op een neutrale glas-surface als colorHex geen hex-kleur is (nog geen speler bekend)', () => {
    render(<Dice value={2} colorHex="var(--surface-3)" context="phone" size={58} radius={13} padding={8} gap={3} pipSize={9} />)
    expect(screen.getByRole('img', { name: 'Dobbelsteen 2' })).toBeInTheDocument()
  })
})
