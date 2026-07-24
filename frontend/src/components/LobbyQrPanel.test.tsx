import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LobbyQrPanel } from './LobbyQrPanel'

describe('LobbyQrPanel', () => {
  it('toont de join-url en de gamecode', () => {
    render(<LobbyQrPanel gameId="ABC123" origin="https://atlas.example" />)

    expect(screen.getByText('https://atlas.example/play/ABC123')).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('rendert een QR-afbeelding met de join-url in het label', async () => {
    render(<LobbyQrPanel gameId="ABC123" origin="https://atlas.example" />)

    expect(
      await screen.findByRole('img', { name: /https:\/\/atlas\.example\/play\/ABC123/ }),
    ).toBeInTheDocument()
  })
})
