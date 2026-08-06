import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto } from '../../../types/GameState'
import { TvInitialPlacementScreen } from './TvInitialPlacementScreen'
import { fixtureState } from './tvScreenFixture'

const geoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { properties: { id: 'alaska', continent: 'north-america', centroid: [-152.59, 64.29] }, geometry: { type: 'Polygon', coordinates: [[[-170, 60], [-140, 60], [-140, 70], [-170, 70]]] } },
    { properties: { id: 'ukraine', continent: 'europe', centroid: [31.16, 48.38] }, geometry: { type: 'Polygon', coordinates: [[[20, 45], [40, 45], [40, 55], [20, 55]]] } },
  ],
}

const baseState = {
  ...fixtureState,
  phase: GamePhaseDto.InitialPlacement,
  territories: [
    { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 3 },
    { territoryId: 'ukraine', ownerPlayerId: 'bob', armyCount: 5 },
  ],
}

describe('TvInitialPlacementScreen', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(geoFeatureCollection) }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rendert niets zonder setupState (fase nog niet InitialPlacement)', () => {
    const { container } = render(
      <TvInitialPlacementScreen state={{ ...baseState, setupState: null }} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('toont de actieve speler zolang die er is (SetupMode.Claiming)', () => {
    const state = {
      ...baseState,
      setupState: { activePlayerId: 'alice', remainingArmiesByPlayer: {}, claimableTerritoryIdsByPlayer: {} },
    }
    render(<TvInitialPlacementScreen state={state} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText(/Aan de beurt Alice/)).toBeInTheDocument()
  })

  it('toont een neutrale kop zonder crash als niemand actief is (SetupMode.Random, iedereen plaatst tegelijk)', () => {
    const state = {
      ...baseState,
      setupState: { activePlayerId: null, remainingArmiesByPlayer: {}, claimableTerritoryIdsByPlayer: {} },
    }
    render(<TvInitialPlacementScreen state={state} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('Iedereen plaatst tegelijk')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('rendert het legeraantal per territorium zodra de geometrie geladen is', async () => {
    const state = {
      ...baseState,
      setupState: { activePlayerId: null, remainingArmiesByPlayer: {}, claimableTerritoryIdsByPlayer: {} },
    }
    render(<TvInitialPlacementScreen state={state} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('heeft geen click-handler op de gebiedslagen (read-only, FO §7.3/§2.3)', async () => {
    const state = {
      ...baseState,
      setupState: { activePlayerId: null, remainingArmiesByPlayer: {}, claimableTerritoryIdsByPlayer: {} },
    }
    render(<TvInitialPlacementScreen state={state} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())

    document.querySelectorAll('path, svg circle').forEach((el) => fireEvent.click(el))

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
