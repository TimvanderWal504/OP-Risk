import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto, TurnPhaseDto, RecentActionKindDto } from '../../../types/GameState'
import { atlasRoughTok } from '../../../styles/design-tokens'
import { DESIGN_UNIT_PX, designToMap } from '../../../map/boardScale'
import { marker } from '../../../map/boardVisualTokens'
import { TvShell } from '../../../components/ui/TvShell'
import { TvMainBoardScreen } from './TvMainBoardScreen'
import { fixtureState } from './tvScreenFixture'
import { tvTextScaleMax } from '../../../styles/design-tokens'
import { textScaleVars } from '../../../styles/tvDisplay'

const textVar = (element: HTMLElement | null, step: string) => element?.style.getPropertyValue(`--text-${step}`)
const expectedVar = (factor: number, step: string) => (textScaleVars(factor) as Record<string, string>)[`--text-${step}`]

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
    fortifiesRemaining: 1,
    mustTradeInCards: false,
    reachableFortifyGroups: [],
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

  it('schaalt de kaartmarkers als geheel mee met de TV-tekstschaal (plan-testronde-tv punt 2)', async () => {
    const { container } = render(
      <TvShell display={{ ...stateInProgress.tvDisplay, textScale: 100 }}>
        <TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />
      </TvShell>,
    )
    const svg = container.querySelector('svg')! as unknown as HTMLElement
    await waitFor(() => expect(within(svg).getByText('3')).toBeInTheDocument())

    // Tekstschaal 100 = 2×: legertal, schijf en gebiedsnaam groeien samen.
    expect(within(svg).getByText('3').getAttribute('font-size')).toBe(String(marker.armyFontSize * 2))
    expect(within(svg).getByText('3').previousElementSibling?.getAttribute('r')).toBe(String(marker.discR * 2))
    expect(within(svg).getByText('Alaska').getAttribute('font-size')).toBe(String(marker.nameFontSize * 2))
  })

  it('toont het verloop onder de kaart zodra er acties zijn (plan-testronde-tv punt 4)', () => {
    render(<TvMainBoardScreen state={{ ...stateInProgress, recentActions: [{ sequence: 1, kind: RecentActionKindDto.TerritoryClaimed, playerId: 'alice', otherPlayerId: null, territoryId: 'alaska', fromTerritoryId: null, amount: null, total: null, attackerLosses: null, defenderLosses: null }] }} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('Verloop')).toBeInTheDocument()
    expect(screen.getAllByText('claimt Alaska').length).toBeGreaterThan(0)
  })

  it('toont geen verloop zonder acties', () => {
    render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.queryByText('Verloop')).not.toBeInTheDocument()
  })

  it('toont het spelerspaneel met gebieds- en legertotalen per speler', () => {
    render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('Spelers')).toBeInTheDocument()
    // Beide spelers bezitten in deze fixture precies 1 gebied.
    expect(screen.getAllByText('1 gebieden')).toHaveLength(2)
    expect(screen.getAllByText('Legers')).toHaveLength(2)
  })

  it('toont het handaantal per speler in het spelerspaneel zodra ≥1, taak 6 (FO §7: publiek)', () => {
    const stateWithHands = {
      ...stateInProgress,
      players: stateInProgress.players.map((player) => (player.id === 'alice' ? { ...player, handCount: 3 } : player)),
    }
    render(<TvMainBoardScreen state={stateWithHands} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('1 gebieden · 3 kaarten')).toBeInTheDocument()
    // Bob heeft in deze fixture handCount 0 — geen "0 kaarten"-ruis (Invisible Design Rule).
    expect(screen.getByText('1 gebieden')).toBeInTheDocument()
  })

  it('toont geen handaantal-suffix bij handCount 0', () => {
    render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.queryByText(/kaarten/)).not.toBeInTheDocument()
  })

  describe('rol-badge (plan-rollen B3/C4)', () => {
    const stateWithRole = {
      ...stateInProgress,
      roles: [{ id: 'generaal', name: 'Generaal', description: '', originTerritory: 'china' }],
      players: stateInProgress.players.map((player) =>
        player.id === 'alice' ? { ...player, roleId: 'generaal', isRoleActive: true } : player,
      ),
    }

    it('toont de rolnaam als badge naast de naam zodra de speler een rol heeft', () => {
      render(<TvMainBoardScreen state={stateWithRole} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

      expect(screen.getByText('Generaal')).toBeInTheDocument()
    })

    it('toont geen badge voor een speler zonder rol (The Invisible Design Rule)', () => {
      render(<TvMainBoardScreen state={stateWithRole} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

      // Bob heeft in deze fixture geen roleId — alleen Alice's badge hoort te bestaan.
      expect(screen.queryAllByText('Generaal')).toHaveLength(1)
    })

    it('toont niets extra op geen van beide spelers zolang rollen uit staan (roleId altijd null)', () => {
      render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

      expect(screen.queryByText('Generaal')).not.toBeInTheDocument()
    })

    it('wisselt de badge-toon op isRoleActive: pitch-solid actief, silver-outline inactief', () => {
      const stateWithInactiveRole = {
        ...stateWithRole,
        players: stateWithRole.players.map((player) => (player.id === 'alice' ? { ...player, isRoleActive: false } : player)),
      }
      const { rerender } = render(<TvMainBoardScreen state={stateWithRole} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

      expect(screen.getByText('Generaal')).toHaveClass('bg-pitch-400')

      rerender(<TvMainBoardScreen state={stateWithInactiveRole} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

      expect(screen.getByText('Generaal')).toHaveClass('border-silver-700')
    })
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

  it('begrenst de tekstschaal in de kop en de zijkolom: de kaart houdt zijn formaat (besluit 2026-09-26)', () => {
    render(
      <TvShell display={{ ...stateInProgress.tvDisplay, textScale: 100 }}>
        <TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />
      </TvShell>,
    )

    const header = screen.getByText(/Aan de beurt/).closest<HTMLElement>('.glass-panel')
    const sidebar = screen.getByText('Spelers').closest<HTMLElement>('.glass-panel')
    expect(textVar(header, 'size11')).toBe(expectedVar(tvTextScaleMax.mainBoardHeader, 'size11'))
    expect(textVar(sidebar, 'size8')).toBe(expectedVar(tvTextScaleMax.mainBoardSidebar, 'size8'))
  })

  it('kapt een lange naam in de zijkolom af i.p.v. hem over het legeraantal te laten lopen', () => {
    render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('Bob', { selector: 'span.truncate' })).toBeInTheDocument()
  })
})
