import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TvDisplayAccess } from './TvDisplayAccess'
import { TvLanguageDto } from '../types/TvDisplay'

const settings = { textScale: 50, glassOpacity: 50, glassBlur: 50, language: TvLanguageDto.Nl, diceScale: 50 }

describe('TvDisplayAccess', () => {
  it('opent het TV-weergave-paneel en sluit het weer', async () => {
    render(<TvDisplayAccess settings={settings} defaults={settings} onChange={vi.fn().mockResolvedValue(true)} />)

    expect(screen.queryByRole('heading', { name: 'TV-weergave' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'TV-weergave' }))
    expect(screen.getByRole('heading', { name: 'TV-weergave' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))
    expect(screen.queryByRole('heading', { name: 'TV-weergave' })).not.toBeInTheDocument()
  })

  it('stuurt een wijziging in het paneel door', async () => {
    const onChange = vi.fn().mockResolvedValue(true)
    render(<TvDisplayAccess settings={settings} defaults={settings} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'TV-weergave' }))
    await userEvent.click(screen.getByRole('button', { name: 'Engels' }))

    expect(onChange).toHaveBeenCalledWith({ ...settings, language: TvLanguageDto.En })
  })
})
