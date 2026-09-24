import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvLobbyScreen } from './TvLobbyScreen'
import { fixtureState } from './tvScreenFixture'
import { TvShell } from '../../../components/ui/TvShell'
import { glassBlur, glassSurface } from '../../../styles/glass-tokens'

describe('TvLobbyScreen', () => {
  it('toont de wachtkamer met de spelers die al binnen zijn', () => {
    render(<TvLobbyScreen state={fixtureState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('Wachtkamer')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('laat de glazen kicker-badge op het design staan zonder TV-weergave-instelling', () => {
    render(<TvLobbyScreen state={fixtureState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    const badge = screen.getByText('Wachtkamer')
    expect(badge.style.getPropertyValue('--glass-bg')).toBe(glassSurface.raised)
    expect(badge.style.getPropertyValue('--glass-filter')).toContain(`blur(${glassBlur.sm}px)`)
  })

  it('schaalt de glazen kicker-badge mee met glasdekking en -blur (plan-testronde-tv punt 2)', () => {
    render(
      <TvShell display={{ ...fixtureState.tvDisplay, glassOpacity: 0, glassBlur: 100 }}>
        <TvLobbyScreen state={fixtureState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />
      </TvShell>,
    )

    const badge = screen.getByText('Wachtkamer')
    // glassSurface.raised = rgba(36, 50, 70, 0.62); ×0,25 = 0.155.
    expect(badge.style.getPropertyValue('--glass-bg')).toBe('rgba(36, 50, 70, 0.155)')
    expect(badge.style.getPropertyValue('--glass-filter')).toContain(`blur(${glassBlur.sm * 2}px)`)
  })
})
