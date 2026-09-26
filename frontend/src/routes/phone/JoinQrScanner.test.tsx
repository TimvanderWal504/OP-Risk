import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JoinQrScanner } from './JoinQrScanner'
import { useQrScanner } from '../../hooks/useQrScanner'
import type { QrScannerError } from '../../hooks/useQrScanner'

vi.mock('../../hooks/useQrScanner', () => ({ useQrScanner: vi.fn() }))

/** Mockt de camera; de teruggegeven functie speelt een gescande QR-tekst af. */
function mockScanner(error: QrScannerError | null = null) {
  let onDecoded: (text: string) => boolean = () => false
  vi.mocked(useQrScanner).mockImplementation((handler) => {
    onDecoded = handler

    return { videoRef: { current: null }, error }
  })

  return (text: string) => {
    let stopped = false
    act(() => {
      stopped = onDecoded(text)
    })

    return stopped
  }
}

describe('JoinQrScanner', () => {
  it('levert de spelcode af en stopt met scannen bij een join-QR', () => {
    const scan = mockScanner()
    const onGameId = vi.fn()
    render(<JoinQrScanner onGameId={onGameId} onCancel={() => {}} />)

    expect(scan('https://atlas.example/play/ATLAS7')).toBe(true)
    expect(onGameId).toHaveBeenCalledWith('ATLAS7')
  })

  it('scant door en legt uit waarom bij een QR die geen spel is', () => {
    const scan = mockScanner()
    const onGameId = vi.fn()
    render(<JoinQrScanner onGameId={onGameId} onCancel={() => {}} />)

    expect(scan('https://atlas.example/pair/K7M2PQ')).toBe(false)
    expect(onGameId).not.toHaveBeenCalled()
    expect(screen.getByText(/Dit is geen QR-code van een spel/)).toBeInTheDocument()
  })

  it('toont waarom de camera niet opent', () => {
    mockScanner('denied')
    render(<JoinQrScanner onGameId={() => {}} onCancel={() => {}} />)

    expect(screen.getByText(/Geen toegang tot de camera/)).toBeInTheDocument()
  })

  it('"Code typen" gaat terug naar het invoerveld', async () => {
    mockScanner()
    const onCancel = vi.fn()
    render(<JoinQrScanner onGameId={() => {}} onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: 'Code typen' }))

    expect(onCancel).toHaveBeenCalled()
  })
})
