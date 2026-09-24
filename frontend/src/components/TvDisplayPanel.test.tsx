import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TvDisplayPanel } from './TvDisplayPanel'
import { TvLanguageDto, type TvDisplaySettingsDto } from '../types/TvDisplay'

const defaults: TvDisplaySettingsDto = { textScale: 50, glassOpacity: 50, glassBlur: 50, language: TvLanguageDto.Nl, diceScale: 50 }

const accepting = () => vi.fn().mockResolvedValue(true)

/** Rondt een slider-keuze af zoals de browser dat doet: tussenstap(pen) via `input`, dan één native `change`. */
function commitSlider(name: string, value: number) {
  const slider = screen.getByRole('slider', { name })
  fireEvent.input(slider, { target: { value: String(value) } })
  slider.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('TvDisplayPanel', () => {
  it('toont de drie schermregelaars, de dobbelstenen als eigen onderdeel en de taalkeuze', () => {
    render(<TvDisplayPanel settings={defaults} defaults={defaults} onChange={accepting()} onClose={vi.fn()} />)

    expect(screen.getByRole('slider', { name: 'Tekstgrootte' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Dekking van panelen' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Vervaging achter panelen' })).toBeInTheDocument()
    expect(screen.getByText('Dobbelstenen')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Grootte van de dobbelstenen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nederlands' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('stuurt bij een afgeronde slider-keuze de volledige set met alleen dat veld gewijzigd', async () => {
    const onChange = accepting()
    render(<TvDisplayPanel settings={defaults} defaults={defaults} onChange={onChange} onClose={vi.fn()} />)

    await act(async () => commitSlider('Grootte van de dobbelstenen', 75))

    expect(onChange).toHaveBeenCalledWith({ ...defaults, diceScale: 75 })
  })

  it('bouwt een tweede wijziging voort op de eerste zolang die nog onderweg is (elite-code-review)', async () => {
    // Het eerste verzoek blijft hangen: de server heeft nog niets bevestigd, `settings` is nog oud.
    const onChange = vi.fn().mockReturnValueOnce(new Promise<boolean>(() => {})).mockResolvedValue(true)
    render(<TvDisplayPanel settings={defaults} defaults={defaults} onChange={onChange} onClose={vi.fn()} />)

    await act(async () => commitSlider('Tekstgrootte', 70))
    await act(async () => commitSlider('Grootte van de dobbelstenen', 80))

    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, textScale: 70, diceScale: 80 })
  })

  it('valt na een weigering terug op de bevestigde waarden en zet de slider terug', async () => {
    const onChange = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    render(<TvDisplayPanel settings={defaults} defaults={defaults} onChange={onChange} onClose={vi.fn()} error="Mislukt" />)

    await act(async () => commitSlider('Tekstgrootte', 70))

    expect(screen.getByRole('slider', { name: 'Tekstgrootte' })).toHaveValue('50')

    await act(async () => commitSlider('Grootte van de dobbelstenen', 80))

    expect(onChange).toHaveBeenLastCalledWith({ ...defaults, diceScale: 80 })
  })

  it('wisselt de taal op de TV', async () => {
    const onChange = accepting()
    render(<TvDisplayPanel settings={defaults} defaults={defaults} onChange={onChange} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Engels' }))

    expect(onChange).toHaveBeenCalledWith({ ...defaults, language: TvLanguageDto.En })
  })

  it('zet met "Standaard" precies de server-default terug', async () => {
    const onChange = accepting()
    const changed = { ...defaults, textScale: 80, language: TvLanguageDto.En }
    render(<TvDisplayPanel settings={changed} defaults={defaults} onChange={onChange} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Standaard' }))

    expect(onChange).toHaveBeenCalledWith(defaults)
  })

  it('schakelt "Standaard" uit zolang alles al op de default staat', () => {
    render(<TvDisplayPanel settings={defaults} defaults={defaults} onChange={accepting()} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Standaard' })).toBeDisabled()
  })

  it('toont geen fout van vóór het openen, wel een fout van een eigen wijziging', async () => {
    const onChange = vi.fn().mockResolvedValue(false)
    render(<TvDisplayPanel settings={defaults} defaults={defaults} onChange={onChange} onClose={vi.fn()} error="Eerdere fout" />)

    expect(screen.queryByText('Eerdere fout')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Engels' }))

    expect(screen.getByText('Eerdere fout')).toBeInTheDocument()
  })

  it('sluit via "Sluiten"', async () => {
    const onClose = vi.fn()
    render(<TvDisplayPanel settings={defaults} defaults={defaults} onChange={accepting()} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))
    expect(onClose).toHaveBeenCalled()
  })
})
