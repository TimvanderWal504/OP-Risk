import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CreateGameForm } from './CreateGameForm'

const PRESETS_RESPONSE = {
  ok: true,
  json: async () => [{ id: 'classic', armiesByPlayerCount: { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20, 7: 18 } }],
}

describe('CreateGameForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('post naar /games en levert de gameId bij succes', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(PRESETS_RESPONSE)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ gameId: 'ABC123' }),
    })
    const onCreated = vi.fn()

    render(<CreateGameForm mapId="standaard-43" onCreated={onCreated} />)
    await waitFor(() => expect(screen.getByRole('radio', { name: /Klassiek/i })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('ABC123'))
    expect(fetchMock).toHaveBeenCalledWith(
      '/games',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('toont een vertaalde foutmelding als de server het verzoek weigert', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(PRESETS_RESPONSE)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => [{ code: 'lobby.gameFull' }],
    })

    render(<CreateGameForm mapId="standaard-43" onCreated={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('radio', { name: /Klassiek/i })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    expect(await screen.findByText('Dit spel zit vol.')).toBeInTheDocument()
  })
})
