import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PhoneScreen } from './PhoneScreen'

describe('PhoneScreen', () => {
  it('rendert children binnen het gedeelde schermframe', () => {
    render(<PhoneScreen>Scherminhoud</PhoneScreen>)

    expect(screen.getByText('Scherminhoud')).toHaveClass('p-gutter')
  })

  it('houdt de kolom-flexbox waar elk scherm op staat', () => {
    render(<PhoneScreen>Scherminhoud</PhoneScreen>)

    // `min-h-0` is wat de scrollgebieden binnen een scherm laat krimpen i.p.v.
    // buiten de viewport groeien; zonder dat loopt elke lijst door de onderrand.
    expect(screen.getByText('Scherminhoud')).toHaveClass('flex', 'min-h-0', 'flex-1', 'flex-col')
  })

  it('laat de aanroeper layout toevoegen zonder het frame te verliezen', () => {
    render(<PhoneScreen className="items-center text-center">Scherminhoud</PhoneScreen>)

    expect(screen.getByText('Scherminhoud')).toHaveClass('p-gutter', 'items-center', 'text-center')
  })
})
