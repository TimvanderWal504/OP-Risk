import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'
import { useSendGameToTv } from '../../hooks/useSendGameToTv'
import { canScanQr, useQrScanner } from '../../hooks/useQrScanner'
import type { CreateGameFormProps } from '../../components/CreateGameForm'

vi.mock('../../hooks/useSendGameToTv', () => ({ useSendGameToTv: vi.fn() }))
vi.mock('../../hooks/useQrScanner', () => ({ canScanQr: vi.fn(), useQrScanner: vi.fn() }))

// Het echte formulier praat met de REST-API; hier telt alleen wat HomePage met `onCreated` doet.
vi.mock('../../components/CreateGameForm', () => ({
  CreateGameForm: ({ onCreated }: CreateGameFormProps) => (
    <button type="button" onClick={() => void onCreated('NEW123')}>
      spel aanmaken
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
    vi.mocked(canScanQr).mockReturnValue(true)
  })

  it('"TV koppelen" maakt van dit toestel de TV met de koppel-QR', async () => {
    mockSend([])
    renderAt('/')

    await userEvent.click(card(/^TV koppelen/))

    expect(screen.getByText('tv-koppelscherm')).toBeInTheDocument()
  })

  it('een gescande QR brengt de telefoon meteen naar de spelinstellingen', () => {
    mockSend([])
    renderAt('/pair/K7M2PQ')

    expect(screen.getByRole('button', { name: 'spel aanmaken' })).toBeInTheDocument()
  })

  it('stuurt na het aanmaken de spelcode naar de TV en gaat door naar de lobby', async () => {
    const send = mockSend([true])
    renderAt('/pair/K7M2PQ')

    await userEvent.click(screen.getByRole('button', { name: 'spel aanmaken' }))

    await waitFor(() => expect(screen.getByText('lobby NEW123')).toBeInTheDocument())
    expect(send).toHaveBeenCalledWith('K7M2PQ', 'NEW123')
  })

  it('zonder koppelcode stuurt aanmaken niets naar een TV', async () => {
    const send = mockSend([])
    renderAt('/')

    await userEvent.click(card(/Nieuw spel starten/))
    await userEvent.click(screen.getByRole('button', { name: 'spel aanmaken' }))

    expect(screen.getByText('lobby NEW123')).toBeInTheDocument()
    expect(send).not.toHaveBeenCalled()
  })

  it('laat bij een mislukte verzending opnieuw proberen, of door naar de lobby', async () => {
    const send = mockSend([false, true], 'Deze TV is niet meer beschikbaar.')
    renderAt('/pair/K7M2PQ')

    await userEvent.click(screen.getByRole('button', { name: 'spel aanmaken' }))

    expect(await screen.findByText('De TV heeft het spel nog niet')).toBeInTheDocument()
    expect(screen.getByText('Deze TV is niet meer beschikbaar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Naar de lobby' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Opnieuw naar de TV sturen' }))

    await waitFor(() => expect(screen.getByText('lobby NEW123')).toBeInTheDocument())
    expect(send).toHaveBeenCalledTimes(2)
    expect(send).toHaveBeenLastCalledWith('K7M2PQ', 'NEW123')
  })

  it('met de hand ingevoerde TV-code leidt ook naar de instellingen en koppelt die TV', async () => {
    const send = mockSend([true])
    renderAt('/')

    await userEvent.click(card(/Code van de TV invoeren/))
    await userEvent.type(screen.getByRole('textbox', { name: 'Code van de TV' }), 'k7m2pq')
    await userEvent.click(screen.getByRole('button', { name: 'Verder naar instellingen' }))
    await userEvent.click(screen.getByRole('button', { name: 'spel aanmaken' }))

    await waitFor(() => expect(screen.getByText('lobby NEW123')).toBeInTheDocument())
    expect(send).toHaveBeenCalledWith('K7M2PQ', 'NEW123')
  })

  it('een gescande join-QR leidt naar de lobby van dat spel', async () => {
    mockSend([])
    let onDecoded: (text: string) => boolean = () => false
    vi.mocked(useQrScanner).mockImplementation((handler) => {
      onDecoded = handler

      return { videoRef: { current: null }, error: null }
    })
    renderAt('/')

    await userEvent.click(card(/Deelnemen aan een spel/))
    await userEvent.click(screen.getByRole('button', { name: 'QR-code scannen' }))
    act(() => void onDecoded('https://atlas.example/play/ATLAS7'))

    expect(screen.getByText('lobby ATLAS7')).toBeInTheDocument()
  })

  it('zonder camera (geen HTTPS) staat er geen scanknop', async () => {
    mockSend([])
    vi.mocked(canScanQr).mockReturnValue(false)
    renderAt('/')

    await userEvent.click(card(/Deelnemen aan een spel/))

    expect(screen.queryByRole('button', { name: 'QR-code scannen' })).not.toBeInTheDocument()
  })
})
