import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { canScanQr, useQrScanner } from './useQrScanner'

function stubCamera(getUserMedia: () => Promise<MediaStream>) {
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: vi.fn(getUserMedia) } })
}

describe('useQrScanner', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('kan zonder getUserMedia (geen HTTPS) niet scannen', () => {
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: undefined })

    expect(canScanQr()).toBe(false)
  })

  it('kan scannen zodra de browser een camera aanbiedt', () => {
    stubCamera(() => new Promise(() => {}))

    expect(canScanQr()).toBe(true)
  })

  it('meldt een geweigerde camera-toestemming als "denied"', async () => {
    stubCamera(() => Promise.reject(new DOMException('nee', 'NotAllowedError')))

    const { result } = renderHook(() => useQrScanner(() => false))

    await waitFor(() => expect(result.current.error).toBe('denied'))
  })

  it('meldt elke andere camerafout als "unavailable"', async () => {
    stubCamera(() => Promise.reject(new DOMException('geen camera', 'NotFoundError')))

    const { result } = renderHook(() => useQrScanner(() => false))

    await waitFor(() => expect(result.current.error).toBe('unavailable'))
  })
})
