import { act, render, renderHook, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toastAnchor, useToastAnchorInset } from './useToastAnchorInset'

/** jsdom rekent geen layout: een blok krijgt hier zijn eigen `top` en hoogte. */
function Anchor({ top, height = 60 }: { top: number; height?: number }) {
  return (
    <div
      {...toastAnchor}
      ref={(element) => {
        if (element) element.getBoundingClientRect = () => ({ top, height, width: 390, left: 20, right: 410, bottom: top + height, x: 20, y: top, toJSON: () => ({}) })
      }}
    />
  )
}

describe('useToastAnchorInset', () => {
  const layerRef = createRef<HTMLDivElement>()

  beforeEach(() => {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('laat ruimte vrij van het hoogste knoppenblok tot de onderkant van het scherm', async () => {
    render(
      <>
        <Anchor top={700} />
        <Anchor top={640} />
      </>,
    )
    const { result } = renderHook(() => useToastAnchorInset(true, layerRef))

    await waitFor(() => expect(result.current).toBe(160))
  })

  it('is 0 zonder knoppenblok, of met een blok zonder afmetingen', async () => {
    render(<Anchor top={640} height={0} />)
    const { result } = renderHook(() => useToastAnchorInset(true, layerRef))

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })
    expect(result.current).toBe(0)
  })

  it('meet opnieuw als het scherm verandert terwijl er een toast staat', async () => {
    const { rerender } = render(<Anchor key="a" top={700} />)
    const { result } = renderHook(() => useToastAnchorInset(true, layerRef))
    await waitFor(() => expect(result.current).toBe(100))

    rerender(<Anchor key="b" top={600} />)

    await waitFor(() => expect(result.current).toBe(200))
  })

  it('meet niet zolang er geen toast staat', async () => {
    render(<Anchor top={640} />)
    const { result } = renderHook(() => useToastAnchorInset(false, layerRef))

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })
    expect(result.current).toBe(0)
  })
})
