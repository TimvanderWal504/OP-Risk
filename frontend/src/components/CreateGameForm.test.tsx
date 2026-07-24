import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CreateGameForm } from './CreateGameForm'

describe('CreateGameForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('post naar /games en levert de gameId bij succes', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ gameId: 'ABC123' }),
    })
    const onCreated = vi.fn()

    render(<CreateGameForm mapId="standaard-43" onCreated={onCreated} />)
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('ABC123'))
    expect(fetchMock).toHaveBeenCalledWith(
      '/games',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('toont een foutmelding als de server het verzoek weigert', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ['Ongeldige instellingen.'],
    })

    render(<CreateGameForm mapId="standaard-43" onCreated={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    expect(await screen.findByText('Ongeldige instellingen.')).toBeInTheDocument()
  })
})
