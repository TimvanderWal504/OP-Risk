import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { TvPairPage } from './TvPairPage'
import { useTvPairing } from '../../hooks/useTvPairing'

vi.mock('../../hooks/useTvPairing', () => ({ useTvPairing: vi.fn() }))

function renderPage(pairing: ReturnType<typeof useTvPairing>) {
  vi.mocked(useTvPairing).mockReturnValue(pairing)

  return render(
    <MemoryRouter initialEntries={['/tv']}>
      <Routes>
        <Route path="/tv" element={<TvPairPage />} />
        <Route path="/tv/:gameId" element={<div>TV-spel</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TvPairPage', () => {
  it('toont de koppel-QR met de koppelcode', async () => {
    renderPage({ pairingCode: 'K7M2PQ', pairedGameId: null, failed: false })

    expect(screen.getByText('K7M2PQ')).toBeInTheDocument()
    expect(screen.getByText(`${window.location.origin}/pair/K7M2PQ`)).toBeInTheDocument()
    expect(screen.getByText('Wachten tot de host scant en een spel aanmaakt…')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /\/pair\/K7M2PQ/ })).toBeInTheDocument()
  })

  it('toont "verbinden" zolang er nog geen code is', () => {
    renderPage({ pairingCode: null, pairedGameId: null, failed: false })

    expect(screen.getByText('Verbinden…')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('gaat door naar het spel zodra de host er een stuurt', () => {
    renderPage({ pairingCode: 'K7M2PQ', pairedGameId: 'ATLAS7', failed: false })

    expect(screen.getByText('TV-spel')).toBeInTheDocument()
  })
})
