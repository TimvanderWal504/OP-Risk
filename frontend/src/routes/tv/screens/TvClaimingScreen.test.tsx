import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto } from '../../../types/GameState'
import { claimMarker } from '../../../map/boardVisualTokens'
import { TvClaimingScreen } from './TvClaimingScreen'
import { fixtureState } from './tvScreenFixture'

const geoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { properties: { id: 'alaska', continent: 'north-america', centroid: [-152.59, 64.29] }, geometry: { type: 'Polygon', coordinates: [[[-170, 60], [-140, 60], [-140, 70], [-170, 70]]] } },
    { properties: { id: 'ukraine', continent: 'europe', centroid: [31.16, 48.38] }, geometry: { type: 'Polygon', coordinates: [[[20, 45], [40, 45], [40, 55], [20, 55]]] } },
  ],
}

const claimingState = {
  ...fixtureState,
  phase: GamePhaseDto.Claiming,
  territories: [
    { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 0 },
    { territoryId: 'ukraine', ownerPlayerId: null, armyCount: 0 },
  ],
  setupState: {
    activePlayerId: 'bob',
    remainingArmiesByPlayer: {},
    claimableTerritoryIdsByPlayer: {},
  },
}

describe('TvClaimingScreen', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(geoFeatureCollection) }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rendert niets zolang er geen actieve claimer is (versie-skew-vangnet)', () => {
    const { container } = render(
      <TvClaimingScreen
        state={{ ...claimingState, setupState: { ...claimingState.setupState, activePlayerId: 'onbekend' } }}
        orderRollThrows={{}}
        lastClaimedTerritoryId={null}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('toont de teller als "geclaimd / totaal", niet een hardcoded totaal', () => {
    render(<TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId={null} />)

    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    // "Bob" staat twee keer: als actieve claimer in de topbar én in het rechterpaneel
    // (Host-scherm.dc.html L193, L245) — beide horen er te zijn, niet dubbel geteld als bug.
    expect(screen.getAllByText('Bob')).toHaveLength(2)
  })

  it('toont de flare-ring alleen op het laatst geclaimde gebied, niet zonder event', async () => {
    const { container, rerender } = render(
      <TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId={null} />,
    )
    await waitFor(() => expect(container.querySelector('path')).not.toBeNull())

    expect(container.querySelector(`circle[r="${claimMarker.flareR}"]`)).toBeNull()

    rerender(<TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId="alaska" />)

    const flare = container.querySelector(`circle[r="${claimMarker.flareR}"]`)
    expect(flare).not.toBeNull()
  })

  it('heeft geen click-handler op de gebiedslagen (read-only, FO §7.3/§2.3)', async () => {
    render(<TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId="alaska" />)
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())

    document.querySelectorAll('path, svg circle').forEach((el) => fireEvent.click(el))

    // Klikken op een gebiedsvorm/marker mag niets veranderen — er is geen `onClaim`-achtige
    // prop op dit scherm; de telefoon is de enige invoerbron (FO §7.3/§2.3).
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })
})
