import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QrCodePanel } from './QrCodePanel'

describe('QrCodePanel', () => {
  it('toont titel, url en code', () => {
    render(<QrCodePanel url="https://atlas.example/pair/K7M2PQ" code="K7M2PQ" title="Scan mij" ariaLabel="QR" />)

    expect(screen.getByText('Scan mij')).toBeInTheDocument()
    expect(screen.getByText('https://atlas.example/pair/K7M2PQ')).toBeInTheDocument()
    expect(screen.getByText('K7M2PQ')).toBeInTheDocument()
  })

  it('rendert een QR-afbeelding met het meegegeven label', async () => {
    render(<QrCodePanel url="https://atlas.example/pair/K7M2PQ" code="K7M2PQ" title="Scan mij" ariaLabel="QR voor koppelen" />)

    expect(await screen.findByRole('img', { name: 'QR voor koppelen' })).toBeInTheDocument()
  })
})
