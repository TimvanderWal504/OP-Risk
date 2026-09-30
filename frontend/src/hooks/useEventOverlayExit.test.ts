import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEventOverlayExit, type ShownEvent } from './useEventOverlayExit'

const card: ShownEvent = { eventId: 'babyboom', draw: { eventId: 'babyboom', sequence: 5 } }

const render = (initial: ShownEvent | null) =>
  renderHook(({ shown, combat }) => useEventOverlayExit(shown, combat), {
    initialProps: { shown: initial, combat: false },
  })

describe('useEventOverlayExit', () => {
  it('laat een kaart die weg moet nog uitgaan, tot de animatie klaar is', () => {
    const { result, rerender } = render(card)
    expect(result.current.leaving).toBeNull()

    rerender({ shown: null, combat: false })
    expect(result.current.leaving).toEqual(card)

    act(() => result.current.onLeft())
    expect(result.current.leaving).toBeNull()
  })

  it('geeft een kaart die een gevecht vervangt geen uitgang', () => {
    const { result, rerender } = render(card)

    rerender({ shown: null, combat: true })

    expect(result.current.leaving).toBeNull()
  })

  it('breekt een uitgang af als er meteen weer een kaart staat', () => {
    const { result, rerender } = render(card)
    rerender({ shown: null, combat: false })

    const next: ShownEvent = { eventId: 'griepgolf', draw: null }
    rerender({ shown: next, combat: false })

    expect(result.current.leaving).toBeNull()
  })

  it('ziet een nieuw object met dezelfde kaart niet als een wissel', () => {
    const { result, rerender } = render(card)

    rerender({ shown: { ...card, draw: { ...card.draw! } }, combat: false })
    rerender({ shown: null, combat: false })

    expect(result.current.leaving).toEqual(card)
  })

  it('doet niets zonder kaart', () => {
    const { result, rerender } = render(null)

    rerender({ shown: null, combat: false })

    expect(result.current.leaving).toBeNull()
  })
})
