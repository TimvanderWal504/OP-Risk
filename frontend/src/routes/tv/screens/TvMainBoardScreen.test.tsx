import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto, TurnPhaseDto } from '../../../types/GameState'
import { atlasRoughTok } from '../../../styles/design-tokens'
import { DESIGN_UNIT_PX, designToMap } from '../../../map/boardScale'
import { TvMainBoardScreen } from './TvMainBoardScreen'
import { fixtureState } from './tvScreenFixture'

const geoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { properties: { id: 'alaska', continent: 'north-america', centroid: [-152.59, 64.29] }, geometry: { type: 'Polygon', coordinates: [[[-170, 60], [-140, 60], [-140, 70], [-170, 70]]] } },
    { properties: { id: 'ukraine', continent: 'europe', centroid: [31.16, 48.38] }, geometry: { type: 'Polygon', coordinates: [[[20, 45], [40, 45], [40, 55], [20, 55]]] } },
  ],
}

const stateInProgress = {
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  territories: [
    { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 3 },
    { territoryId: 'ukraine', ownerPlayerId: 'bob', armyCount: 5 },
  ],
  turnState: {
    activePlayerId: 'alice',
    turnPhase: TurnPhaseDto.Reinforce,
    armiesRemaining: 4,
    pendingCombat: null,
    timer: { remainingMs: 120_000, isPaused: false },
    reinforcementBreakdown: null,
  },
}

describe('TvMainBoardScreen', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(geoFeatureCollection) }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rendert niets zolang er geen turnState is (fase nog niet InProgress)', () => {
    const { container } = render(<TvMainBoardScreen state={{ ...fixtureState, turnState: null }} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('toont de beurtstatus-header voor de actieve speler', () => {
    render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText(/Aan de beurt: Alice/)).toBeInTheDocument()
  })

  it('rendert een gebiedsvorm en het legeraantal per territorium zodra de geometrie geladen is', async () => {
    const { container } = render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    // Gescoped op de SVG: het zijpaneel toont sinds 2026-08-10 ook legertotalen per speler, en
    // bij deze fixture (één gebied per speler) vallen die toevallig samen met de
    // gebieds-legeraantallen (3/5) — zonder scope zou getByText dubbel matchen.
    // `within()` verwacht HTMLElement-typing; de SVG-wortel is hier functioneel identiek
    // (querySelector/getByText werken erop), alleen TypeScript's DOM-lib maakt onderscheid.
    const svg = container.querySelector('svg')! as unknown as HTMLElement
    await waitFor(() => expect(within(svg).getByText('3')).toBeInTheDocument())
    expect(within(svg).getByText('5')).toBeInTheDocument()
  })

  it('hangt de gebiedenlaag in het atlasRough-filter (zoals in het oorspronkelijke design)', async () => {
    const { container } = render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)
    // `within()` verwacht HTMLElement-typing; de SVG-wortel is hier functioneel identiek
    // (querySelector/getByText werken erop), alleen TypeScript's DOM-lib maakt onderscheid.
    const svg = container.querySelector('svg')! as unknown as HTMLElement
    await waitFor(() => expect(within(svg).getByText('3')).toBeInTheDocument())

    const filter = container.querySelector('filter#atlasRough')
    expect(filter).not.toBeNull()

    const turbulence = filter?.querySelector('feTurbulence')
    expect(turbulence?.getAttribute('baseFrequency')).toBe(String(atlasRoughTok.baseFrequency / DESIGN_UNIT_PX))
    expect(turbulence?.getAttribute('numOctaves')).toBe(String(atlasRoughTok.numOctaves))
    expect(turbulence?.getAttribute('seed')).toBe(String(atlasRoughTok.seed))

    const displacement = filter?.querySelector('feDisplacementMap')
    expect(displacement?.getAttribute('scale')).toBe(String(designToMap(atlasRoughTok.scale)))

    const path = container.querySelector('path')
    expect(path?.closest('g')?.getAttribute('filter')).toBe('url(#atlasRough)')
  })

  it('toont het spelerspaneel met gebieds- en legertotalen per speler', () => {
    render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('Spelers')).toBeInTheDocument()
    // Beide spelers bezitten in deze fixture precies 1 gebied.
    expect(screen.getAllByText('1 gebieden')).toHaveLength(2)
    expect(screen.getAllByText('Legers')).toHaveLength(2)
  })

  it('dimt een uitgeschakelde speler in het spelerspaneel', () => {
    const stateWithElimination = {
      ...stateInProgress,
      players: stateInProgress.players.map((player) => (player.id === 'bob' ? { ...player, isEliminated: true } : player)),
    }
    render(<TvMainBoardScreen state={stateWithElimination} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    const bobRow = screen.getByText('Bob').closest('div[style*="opacity"]')
    expect(bobRow).toHaveStyle({ opacity: '0.5' })
  })
})
