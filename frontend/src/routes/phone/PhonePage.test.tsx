import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PhonePage } from './PhonePage'
import { fixtureProps, fixtureState } from './screens/phoneScreenFixture'
import { useGameState } from '../../hooks/useGameState'
import { GamePhaseDto, TurnPhaseDto, type GameStateDto } from '../../types/GameState'

vi.mock('../../hooks/useGameState', () => ({ useGameState: vi.fn() }))

const [alice, bob] = fixtureState.players

const inProgress = (players = fixtureState.players): GameStateDto => ({
  ...fixtureState,
  phase: GamePhaseDto.InProgress,
  players,
  turnState: {
    activePlayerId: 'bob',
    turnPhase: TurnPhaseDto.Attack,
    armiesRemaining: 0,
    pendingCombat: null,
    timer: { remainingMs: 60_000, isPaused: false },
    reinforcementBreakdown: null,
    fortifiesRemaining: 1,
    mustTradeInCards: false,
    reachableFortifyGroups: [],
  },
})

/** De route zoals de app 'm mount; `useGameState` levert de gemockte state. */
function renderPage(state: GameStateDto, playerId: string) {
  vi.mocked(useGameState).mockReturnValue({
    ...fixtureProps(),
    state,
    playerId,
    connectionState: undefined,
    joinGameWithColor: vi.fn(),
  } as unknown as ReturnType<typeof useGameState>)

  return render(
    <MemoryRouter initialEntries={['/play/ABCD']}>
      <Routes>
        <Route path="/play/:gameId" element={<PhonePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PhonePage — uitgeschakelde speler (plan-testronde-tv punt 3)', () => {
  beforeEach(() => {
    vi.mocked(useGameState).mockReset()
  })

  it('toont de header boven het uitgeschakeld-scherm, met spelinfo bereikbaar', async () => {
    renderPage(inProgress([alice, { ...bob, isEliminated: true }]), 'bob')

    expect(screen.getByText('Je bent uitgeschakeld')).toBeInTheDocument()
    expect(screen.getByText('Uitgeschakeld')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Spelinfo' }))
    expect(screen.getByRole('heading', { name: 'Spelinfo' })).toBeInTheDocument()
  })

  it('geeft een uitgeschakelde host de TV-weergave precies één keer, via de header', () => {
    renderPage(inProgress([{ ...alice, isEliminated: true }, bob]), 'alice')

    expect(screen.getAllByRole('button', { name: 'TV-weergave' })).toHaveLength(1)
  })

describe('PhonePage — auto-pass (DESIGN.md § Auto-pass)', () => {
  beforeEach(() => {
    vi.mocked(useGameState).mockReset()
  })

  it('toont een speler op auto-pass zijn eigen scherm, met de header erboven', () => {
    renderPage(inProgress([alice, { ...bob, isAutoPass: true }]), 'bob')

    expect(screen.getByRole('heading', { name: 'Je staat op auto-pass' })).toBeInTheDocument()
    expect(screen.getByText('Auto-pass')).toBeInTheDocument()
  })

  it('laat uitgeschakeld voorgaan op auto-pass', () => {
    renderPage(inProgress([alice, { ...bob, isAutoPass: true, isEliminated: true }]), 'bob')

    expect(screen.getByText('Je bent uitgeschakeld')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Je staat op auto-pass' })).not.toBeInTheDocument()
  })

  it('laat het eindscherm voorgaan: ook wie op auto-pass staat ziet de winnaar', () => {
    renderPage({ ...inProgress([alice, { ...bob, isAutoPass: true }]), phase: GamePhaseDto.Finished, turnState: null, winners: ['alice'] }, 'bob')

    expect(screen.queryByRole('heading', { name: 'Je staat op auto-pass' })).not.toBeInTheDocument()
  })
})
})
