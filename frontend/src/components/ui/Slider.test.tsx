import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Slider } from './Slider'

const renderSlider = (onCommit = vi.fn(), value = 50) =>
  render(
    <Slider label="Tekstgrootte" value={value} min={0} max={100} step={5} formatValue={(v) => `${v}%`} onCommit={onCommit} />,
  )

describe('Slider', () => {
  it('koppelt het label aan de regelaar en toont de waarde', () => {
    renderSlider()

    expect(screen.getByRole('slider', { name: 'Tekstgrootte' })).toHaveValue('50')
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('toont tijdens het slepen de concept-waarde, maar commit nog niets', () => {
    const onCommit = vi.fn()
    renderSlider(onCommit)

    fireEvent.input(screen.getByRole('slider'), { target: { value: '70' } })

    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commit precies één keer bij het afronden van de keuze (native change)', () => {
    const onCommit = vi.fn()
    renderSlider(onCommit)
    const slider = screen.getByRole('slider')

    fireEvent.input(slider, { target: { value: '70' } })
    slider.dispatchEvent(new Event('change', { bubbles: true }))

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith(70)
  })

  it('springt terug naar de bevestigde waarde als de commit geweigerd wordt', async () => {
    renderSlider(vi.fn().mockResolvedValue(false))
    const slider = screen.getByRole('slider')

    await act(async () => {
      fireEvent.input(slider, { target: { value: '70' } })
      slider.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(slider).toHaveValue('50')
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('volgt een nieuwe waarde van buiten (serverbevestiging of reset)', () => {
    const { rerender } = renderSlider(vi.fn(), 50)

    rerender(<Slider label="Tekstgrootte" value={25} min={0} max={100} step={5} formatValue={(v) => `${v}%`} onCommit={vi.fn()} />)

    expect(screen.getByRole('slider')).toHaveValue('25')
    expect(screen.getByText('25%')).toBeInTheDocument()
  })
})
