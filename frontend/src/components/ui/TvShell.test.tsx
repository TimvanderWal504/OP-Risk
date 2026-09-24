import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvShell } from './TvShell'
import { GlassPanel } from './GlassPanel'
import { TvLanguageDto, type TvDisplaySettingsDto } from '../../types/TvDisplay'
import { glassPanelBlurPx, glassSurface } from '../../styles/glass-tokens'

const display = (overrides: Partial<TvDisplaySettingsDto> = {}): TvDisplaySettingsDto => ({
  textScale: 50,
  glassOpacity: 50,
  glassBlur: 50,
  language: TvLanguageDto.Nl,
  diceScale: 50,
  ...overrides,
})

/** De shell-wrapper met de weergave-variabelen: de ouder van de content-wrapper rond `children`. */
const shellOf = (text: string) => screen.getByText(text).parentElement!.parentElement!

describe('TvShell', () => {
  it('rendert children binnen de shell-wrapper', () => {
    render(
      <TvShell>
        <p>Inhoud</p>
      </TvShell>,
    )

    expect(screen.getByText('Inhoud').parentElement).toHaveClass('relative')
  })

  it('zet zonder weergave-instelling geen tekstschaal-variabelen', () => {
    render(
      <TvShell>
        <p>Inhoud</p>
      </TvShell>,
    )

    expect(shellOf('Inhoud').style.getPropertyValue('--text-h1')).toBe('')
  })

  it('zet op het design (50) exact de waarden van de typeschaal', () => {
    render(
      <TvShell display={display()}>
        <p>Inhoud</p>
      </TvShell>,
    )

    // 28px / 16 = 1.75rem, zelfde als --text-h1 in twc-theme.css.
    expect(shellOf('Inhoud').style.getPropertyValue('--text-h1')).toBe('1.75rem')
  })

  it('schaalt elke tekststap met de tekstschaal-factor', () => {
    render(
      <TvShell display={display({ textScale: 100 })}>
        <p>Inhoud</p>
      </TvShell>,
    )

    const shell = shellOf('Inhoud')
    expect(shell.style.getPropertyValue('--text-h1')).toBe('3.5rem')
    expect(shell.style.getPropertyValue('--text-size14')).toBe('16.5rem')
  })

  it('geeft glasdekking en -blur door aan een TV-GlassPanel', () => {
    render(
      <TvShell display={display({ glassOpacity: 0, glassBlur: 100 })}>
        <GlassPanel elevation="base" context="tv">
          Paneel
        </GlassPanel>
      </TvShell>,
    )

    const panel = screen.getByText('Paneel')
    // glassSurface.base = rgba(20, 29, 44, 0.72); ×0,25 = 0.18.
    expect(panel.style.getPropertyValue('--glass-bg')).toBe('rgba(20, 29, 44, 0.18)')
    expect(panel.style.getPropertyValue('--glass-filter')).toContain(`blur(${glassPanelBlurPx('base', 'tv') * 2}px)`)
  })

  it('laat een telefoon-GlassPanel binnen de shell ongemoeid', () => {
    render(
      <TvShell display={display({ glassOpacity: 0, glassBlur: 100 })}>
        <GlassPanel elevation="base" context="phone">
          Telefoonpaneel
        </GlassPanel>
      </TvShell>,
    )

    const panel = screen.getByText('Telefoonpaneel')
    expect(panel.style.getPropertyValue('--glass-bg')).toBe(glassSurface.base)
    expect(panel.style.getPropertyValue('--glass-filter')).toContain(`blur(${glassPanelBlurPx('base', 'phone')}px)`)
  })
})
