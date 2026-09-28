import { useEffect } from 'react'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TvPage } from './TvPage'
import { useTvGame } from '../../hooks/useTvGame'
import { ToastProvider } from '../../hooks/ToastProvider'
import { useToast } from '../../hooks/useToast'
import type { ToastApi } from '../../hooks/ToastContext'

vi.mock('../../hooks/useTvGame', () => ({ useTvGame: vi.fn() }))

function mockTvGame(overrides: Partial<ReturnType<typeof useTvGame>>) {
  vi.mocked(useTvGame).mockReturnValue({
    state: null,
    connectionState: 'Connected',
    unknownGame: false,
    orderRollThrows: {},
    lastClaimedTerritoryId: null,
    combat: null,
    ...overrides,
  } as unknown as ReturnType<typeof useTvGame>)
}

function renderTvPage() {
  const api: { current?: ToastApi } = {}

  function CaptureToast() {
    const toast = useToast()
    useEffect(() => {
      api.current = toast
    })
    return null
  }

  render(
    <MemoryRouter initialEntries={['/tv/ATLAS7']}>
      <Routes>
        <Route
          path="/tv/:gameId"
          element={
            <ToastProvider device="tv">
              <CaptureToast />
              <TvPage />
            </ToastProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )

  return api
}

describe('TvPage', () => {
  beforeEach(() => {
    vi.mocked(useTvGame).mockReset()
  })

  it('toont een onbekend spel als volledig scherm', () => {
    mockTvGame({ unknownGame: true })
    renderTvPage()

    expect(screen.getByText('Onbekend spel.')).toBeInTheDocument()
  })

  it('blijft bij een tijdelijke fout op "verbinden" en toont de toast binnen het TV-scherm', () => {
    mockTvGame({})
    const api = renderTvPage()

    act(() => api.current!.showError('Verbinding mislukt.'))

    expect(screen.getByRole('alert')).toHaveTextContent('Verbinding mislukt.')
    expect(screen.getByText('Verbinden…')).toBeInTheDocument()
    expect(screen.queryByText('Onbekend spel.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
