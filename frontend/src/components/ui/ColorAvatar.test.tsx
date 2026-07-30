import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ColorAvatar } from './ColorAvatar'

const color = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' }

describe('ColorAvatar', () => {
  it('toont het kleursymbool van de speler', () => {
    render(<ColorAvatar color={color} variant="banner" />)
    expect(screen.getByText('●')).toBeInTheDocument()
  })

  it('valt terug op een neutrale achtergrond zonder kleur', () => {
    const { container } = render(<ColorAvatar color={null} variant="row" />)
    expect(container.textContent).toBe('')
  })
})
