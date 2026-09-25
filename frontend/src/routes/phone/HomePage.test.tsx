import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'
import { useSendGameToTv } from '../../hooks/useSendGameToTv'
import type { CreateGameFormProps } from '../../components/CreateGameForm'

vi.mock('../../hooks/useSendGameToTv', () => ({ useSendGameToTv: vi.fn() }))

// Het echte formulier praat met de REST-API; hier telt alleen wat HomePage met `onCreated` doet.
vi.mock('../../components/CreateGameForm', () => ({
  CreateGameForm: ({ onCreated }: CreateGameFormProps) => (
    <button type="button" onClick={() => void onCreated('NEW123')}>
      aanmaken
    </button>
  ),
}))

function PlayRoute() {
  return <div>lobby {useParams().gameId}</div>
}

function mockSend(results: boolean[], error: string | null = null) {
  const send = vi.fn(() => Promise.resolve(results.shift() ?? true))
  vi.mocked(useSendGameToTv).mockReturnValue({ send, sending: false, error })

  return send
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pair/:pairingCode" element={<HomePage />} />
        <Route path="/tv" element={<div>tv-koppelscherm</div>} />
        <Route path="/play/:gameId" element={<PlayRoute />} />
      </Routes>
    </MemoryRouter>,
  )
}

const card = (name: RegExp) => screen.getByRole('button', { name })

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(useSendGameToTv).mockReset()
  })

  it('"TV opzetten" maakt van dit toestel de TV', async () => {
    mockSend([])
    renderAt('/')

    await userEvent.click(card(/TV opzetten/))

    expect(screen.getByText('tv-koppelscherm')).toBeInTheDocument()
  })

  it('"TV koppelen" leidt met de ingetypte code naar de koppelstap', async () => {
    mockSend([])
    renderAt('/')

    await userEvent.click(card(/TV koppelen/))
    await userEvent.type(screen.getByRole('textbox', { name: 'Koppelcode' }), 'k7m2pq')
    await userEvent.click(screen.getByRole('button', { name: 'Koppelen' }))

    expect(screen.getByText('TV gevonden')).toBeInTheDocument()
    expect(card(/Spelcode naar TV sturen/)).toBeInTheDocument()
  })

  it('stuurt een nieuw aangemaakt spel naar de TV en gaat door naar de lobby', async () => {
    const send = mockSend([true])
    renderAt('/pair/K7M2PQ')

    await userEvent.click(card(/Nieuw spel starten/))
    await userEvent.click(screen.getByRole('button', { name: 'aanmaken' }))

    await waitFor(() => expect(screen.getByText('lobby NEW123')).toBeInTheDocument())
    expect(send).toHaveBeenCalledWith('K7M2PQ', 'NEW123')
  })

  it('houdt de nieuwe lobby bereikbaar als het sturen mislukt, en probeert opnieuw', async () => {
    const send = mockSend([false, true], 'Deze TV is niet meer beschikbaar.')
    renderAt('/pair/K7M2PQ')

    await userEvent.click(card(/Nieuw spel starten/))
    await userEvent.click(screen.getByRole('button', { name: 'aanmaken' }))

    expect(await screen.findByText('Deze TV is niet meer beschikbaar.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Spelcode' })).toHaveValue('NEW123')
    expect(screen.getByRole('button', { name: 'Naar de lobby' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Naar TV sturen' }))

    await waitFor(() => expect(screen.getByText('lobby NEW123')).toBeInTheDocument())
    expect(send).toHaveBeenLastCalledWith('K7M2PQ', 'NEW123')
  })

  it('bevestigt een bestaande spelcode en biedt de weg terug naar de start', async () => {
    const send = mockSend([true])
    renderAt('/pair/K7M2PQ')

    await userEvent.click(card(/Spelcode naar TV sturen/))
    await userEvent.type(screen.getByRole('textbox', { name: 'Spelcode' }), 'atlas7')
    await userEvent.click(screen.getByRole('button', { name: 'Naar TV sturen' }))

    expect(await screen.findByText('Verstuurd naar de TV')).toBeInTheDocument()
    expect(send).toHaveBeenCalledWith('K7M2PQ', 'ATLAS7')
    expect(screen.queryByRole('button', { name: 'Naar de lobby' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Naar de startpagina' }))

    expect(card(/TV opzetten/)).toBeInTheDocument()
  })

  it('biedt na versturen van een andere code nog steeds de eigen, net aangemaakte lobby', async () => {
    mockSend([false, true])
    renderAt('/pair/K7M2PQ')

    await userEvent.click(card(/Nieuw spel starten/))
    await userEvent.click(screen.getByRole('button', { name: 'aanmaken' }))
    const input = await screen.findByRole('textbox', { name: 'Spelcode' })
    await userEvent.clear(input)
    await userEvent.type(input, 'ATLAS7')
    await userEvent.click(screen.getByRole('button', { name: 'Naar TV sturen' }))

    expect(await screen.findByText('Verstuurd naar de TV')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Naar de lobby' }))

    expect(screen.getByText('lobby NEW123')).toBeInTheDocument()
  })
})
