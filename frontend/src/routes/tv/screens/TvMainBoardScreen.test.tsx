import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePhaseDto, TurnPhaseDto } from '../../../types/GameState'
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
    const { container } = render(<TvMainBoardScreen state={{ ...fixtureState, turnState: null }} orderRollThrows={{}} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('toont de beurtstatus-header voor de actieve speler', () => {
    render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('rendert een gebiedsvorm en het legeraantal per territorium zodra de geometrie geladen is', async () => {
    render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} />)

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('meldt een console-fout als de achtergrondafbeelding niet de verwachte afmeting heeft', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<TvMainBoardScreen state={stateInProgress} orderRollThrows={{}} />)

    const img = container.querySelector('img') as HTMLImageElement
    Object.defineProperty(img, 'naturalWidth', { value: 1500, configurable: true })
    Object.defineProperty(img, 'naturalHeight', { value: 790, configurable: true })
    img.dispatchEvent(new Event('load'))

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('onverwachte afmetingen'))
    errorSpy.mockRestore()
  })
})
