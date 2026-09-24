import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinHostWaitStep, type JoinHostWaitStepProps } from './JoinHostWaitStep'
import { TvLanguageDto } from '../types/TvDisplay'

const colors = [{ id: 'red', name: 'Rood', hex: '#C0392B', onHex: '#FFFFFF', symbol: 'circle' }]

const players = [
  { id: '1', name: 'Alice', colorId: 'red', roleId: null, isRoleActive: false, defenseBoostAvailable: false, isHost: true, isEliminated: false, hand: [], hasTradeableCardSet: false, handCount: 0, missionId: null },
  { id: '2', name: 'Bob', colorId: null, roleId: null, isRoleActive: false, defenseBoostAvailable: false, isHost: false, isEliminated: false, hand: [], hasTradeableCardSet: false, handCount: 0, missionId: null },
]

const tvDisplay = { textScale: 50, glassOpacity: 50, glassBlur: 50, language: TvLanguageDto.Nl, diceScale: 50 }

const props = (overrides: Partial<JoinHostWaitStepProps> = {}): JoinHostWaitStepProps => ({
  players,
  colors,
  maxPlayers: 7,
  canStart: true,
  onStart: vi.fn(),
  onRemovePlayer: vi.fn(),
  tvDisplay,
  tvDisplayDefault: tvDisplay,
  onSetTvDisplay: vi.fn(),
  ...overrides,
})

describe('JoinHostWaitStep', () => {
  it('toont de aangesloten spelers en de teller', () => {
    render(<JoinHostWaitStep {...props({ canStart: false })} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('2 / 7')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /wachten op spelers/i })).toBeDisabled()
  })

  it('roept onStart aan zodra canStart true is', async () => {
    const onStart = vi.fn()
    render(<JoinHostWaitStep {...props({ onStart })} />)

    await userEvent.click(screen.getByRole('button', { name: /start spel/i }))
    expect(onStart).toHaveBeenCalled()
  })

  it('kan een niet-host speler verwijderen via swipe, maar niet de host', () => {
    const onRemovePlayer = vi.fn()
    render(<JoinHostWaitStep {...props({ onRemovePlayer })} />)

    // Host-rij (Alice) heeft geen swipe-knop.
    const aliceRow = screen.getByText('Alice').closest('[style]')!
    expect(aliceRow.querySelector('button')).toBeNull()

    const bobDraggable = screen.getByText('Bob').closest('div[style*="touch-action"]')! as HTMLElement
    fireEvent.pointerDown(bobDraggable, { clientX: 100 })
    fireEvent.pointerMove(bobDraggable, { clientX: 16 })

    const deleteButton = bobDraggable.parentElement!.querySelector('button')!
    fireEvent.click(deleteButton)
    expect(onRemovePlayer).toHaveBeenCalledWith('2')
  })

  it('opent het TV-weergave-paneel al in de lobby en stuurt een wijziging door (plan-testronde-tv punt 2)', async () => {
    const onSetTvDisplay = vi.fn()
    render(<JoinHostWaitStep {...props({ onSetTvDisplay })} />)

    await userEvent.click(screen.getByRole('button', { name: 'TV-weergave' }))
    await userEvent.click(screen.getByRole('button', { name: 'Engels' }))

    expect(onSetTvDisplay).toHaveBeenCalledWith({ ...tvDisplay, language: TvLanguageDto.En })

    await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))
    expect(screen.queryByRole('heading', { name: 'TV-weergave' })).not.toBeInTheDocument()
  })
})
