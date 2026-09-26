import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto, RecentActionKindDto } from '../../../types/GameState'
import { claimMarker } from '../../../map/boardVisualTokens'
import { TvClaimingScreen } from './TvClaimingScreen'
import { fixtureState } from './tvScreenFixture'
import { TvShell } from '../../../components/ui/TvShell'
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
        lastClaimedTerritoryId={null} combat={null}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('toont het verloop onder de kaart zodra er acties zijn (plan-testronde-tv punt 4)', () => {
    render(<TvClaimingScreen state={{ ...claimingState, recentActions: [{ sequence: 1, kind: RecentActionKindDto.TerritoryClaimed, playerId: 'alice', otherPlayerId: null, territoryId: 'alaska', fromTerritoryId: null, amount: null, total: null, attackerLosses: null, defenderLosses: null }] }} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('Verloop')).toBeInTheDocument()
  })

  it('toont de teller als "geclaimd / totaal", niet een hardcoded totaal', () => {
    render(<TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    // "Bob" staat twee keer: gemerged met "Aan de beurt" als actieve claimer in de topbar,
    // én los in het rechterpaneel — beide horen er te zijn (uit het oorspronkelijke design),
    // niet dubbel geteld als bug.
    expect(screen.getByText(/Aan de beurt: Bob/)).toBeInTheDocument()
    expect(screen.getByText('Bob', { selector: 'span.truncate' })).toBeInTheDocument()
  })

  it('toont de rolnaam als badge naast de naam zodra de speler een rol heeft (plan-rollen B3/C4)', () => {
    const stateWithRole = {
      ...claimingState,
      roles: [{ id: 'generaal', name: 'Generaal', description: '', originTerritory: 'china' }],
      players: claimingState.players.map((player) => (player.id === 'bob' ? { ...player, roleId: 'generaal', isRoleActive: true } : player)),
    }
    render(<TvClaimingScreen state={stateWithRole} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />)

    expect(screen.getByText('Generaal')).toBeInTheDocument()
    // Alice heeft in deze fixture geen roleId — geen badge op haar rij.
    expect(screen.queryAllByText('Generaal')).toHaveLength(1)
  })

  it('toont de flare-ring alleen op het laatst geclaimde gebied, niet zonder event', async () => {
    const { container, rerender } = render(
      <TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />,
    )
    await waitFor(() => expect(container.querySelector('path')).not.toBeNull())

    expect(container.querySelector(`circle[r="${claimMarker.flareR}"]`)).toBeNull()

    rerender(<TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId="alaska" combat={null} />)

    const flare = container.querySelector(`circle[r="${claimMarker.flareR}"]`)
    expect(flare).not.toBeNull()
  })

  it('heeft geen click-handler op de gebiedslagen (read-only, FO §7.3/§2.3)', async () => {
    render(<TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId="alaska" combat={null} />)
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())

    document.querySelectorAll('path, svg circle').forEach((el) => fireEvent.click(el))

    // Klikken op een gebiedsvorm/marker mag niets veranderen — er is geen `onClaim`-achtige
    // prop op dit scherm; de telefoon is de enige invoerbron (FO §7.3/§2.3).
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('begrenst de tekstschaal in de kop en de zijkolom: de kaart houdt zijn formaat (besluit 2026-09-26)', () => {
    render(
      <TvShell display={{ ...claimingState.tvDisplay, textScale: 100 }}>
        <TvClaimingScreen state={claimingState} orderRollThrows={{}} lastClaimedTerritoryId={null} combat={null} />
      </TvShell>,
    )

    const header = screen.getByText('1 / 2').closest<HTMLElement>('.glass-panel')
    const sidebar = screen.getByText('Geclaimd').closest<HTMLElement>('.glass-panel')
    expect(textVar(header, 'size11')).toBe(expectedVar(tvTextScaleMax.claimingHeader, 'size11'))
    expect(textVar(sidebar, 'size8')).toBe(expectedVar(tvTextScaleMax.claimingSidebar, 'size8'))
  })
})
