import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GlassPanel } from './GlassPanel'
import {
  glassPanelBlurPx,
  glassPanelPadding,
  glassPanelRadius,
  glassSurface,
  scaleGlassSurfaceAlpha,
} from '../../styles/glass-tokens'

describe('GlassPanel', () => {
  it('rendert children en zet backdrop-filter aan op een niet-geneste instantie', () => {
    render(
      <GlassPanel elevation="base" context="tv">
        Zijpaneel
      </GlassPanel>,
    )
    const panel = screen.getByText('Zijpaneel')
    expect(panel).toHaveAttribute('data-glass-filter', 'on')
    expect(panel).toHaveStyle({ borderRadius: `${glassPanelRadius.base}px` })
  })

  it('valt automatisch terug op een niet-filterende surface zodra genest', () => {
    render(
      <GlassPanel elevation="base" context="tv">
        <GlassPanel elevation="raised" context="tv">
          Genest paneel
        </GlassPanel>
      </GlassPanel>,
    )
    expect(screen.getByText('Genest paneel')).toHaveAttribute('data-glass-filter', 'off')
  })

  it('zet will-change alleen wanneer animated=true', () => {
    render(
      <GlassPanel elevation="base" context="tv" animated>
        Animerend paneel
      </GlassPanel>,
    )
    expect(screen.getByText('Animerend paneel')).toHaveAttribute('data-glass-animated', 'true')
  })

  it('gebruikt de context-schaal: telefoon-blur is lager dan tv-blur voor dezelfde elevatie', () => {
    expect(glassPanelBlurPx('base', 'phone')).toBeLessThan(glassPanelBlurPx('base', 'tv'))
  })

  it('laat padding weg wanneer padding="none"', () => {
    render(
      <GlassPanel elevation="base" context="tv" padding="none">
        Zonder padding
      </GlassPanel>,
    )
    // Geen `toHaveStyle`/computed style hier: jsdom rapporteert de computed padding van een
    // niet-gezette shorthand als unitless "0" i.p.v. "0px", dus die vergelijking faalt altijd
    // in jsdom ongeacht het componentgedrag. De rauwe `style.padding` toont direct wat het
    // component daadwerkelijk zet (niets) en is de eigenlijke bewering van deze test.
    expect(screen.getByText('Zonder padding').style.padding).toBe('')
  })

  it('gebruikt buiten een TvShell met weergave-instelling exact de design-tint', () => {
    render(
      <GlassPanel elevation="raised" context="tv">
        Designpaneel
      </GlassPanel>,
    )
    expect(screen.getByText('Designpaneel').style.getPropertyValue('--glass-bg')).toBe(glassSurface.raised)
  })

  it('begrenst een opgeschaalde glasdekking op volledig dekkend', () => {
    expect(scaleGlassSurfaceAlpha(glassSurface.overlay, 2)).toBe('rgba(4, 6, 11, 1)')
    expect(scaleGlassSurfaceAlpha(glassSurface.base, 1)).toBe(glassSurface.base)
  })

  it('gebruikt de gedeelde padding-token als default', () => {
    render(
      <GlassPanel elevation="base" context="tv">
        Met padding
      </GlassPanel>,
    )
    expect(screen.getByText('Met padding')).toHaveStyle({ padding: `${glassPanelPadding}px` })
  })
})
