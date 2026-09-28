import { createElement, type ReactNode } from 'react'
import { act, renderHook, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToast } from './useToast'
import { useToastList } from './useToastList'
import { toastAutoDismissMs } from '../styles/motion'

function renderProvider(device: 'phone' | 'tv' = 'phone') {
  const wrapper = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device, children })
  const { result, unmount } = renderHook(() => ({ api: useToast(), list: useToastList() }), { wrapper })

  return { api: () => result.current.api, list: () => result.current.list, unmount }
}

const region = () => screen.getByRole('alert')

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toont een fout en laat hem na de telefoonduur verdwijnen', () => {
    const { api } = renderProvider()

    act(() => api().showError('Mislukt'))
    expect(within(region()).getByText('Mislukt')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(toastAutoDismissMs.phone - 1))
    expect(within(region()).getByText('Mislukt')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    expect(region()).toBeEmptyDOMElement()
  })

  it('rendert op de TV zelf niets, maar levert de lijst aan de TV-route', () => {
    const { api, list } = renderProvider('tv')

    act(() => api().showError('Mislukt'))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(list().device).toBe('tv')
    expect(list().toasts.map((toast) => toast.message)).toEqual(['Mislukt'])
  })

  it('gebruikt op de TV de kortere duur', () => {
    const { api, list } = renderProvider('tv')

    act(() => api().showError('Mislukt'))
    act(() => vi.advanceTimersByTime(toastAutoDismissMs.tv - 1))
    expect(list().toasts).toHaveLength(1)

    act(() => vi.advanceTimersByTime(1))
    expect(list().toasts).toHaveLength(0)
  })

  it('ontdubbelt dezelfde tekst en start dan alleen de timer opnieuw', () => {
    const { api } = renderProvider()

    act(() => api().showError('Mislukt'))
    act(() => vi.advanceTimersByTime(toastAutoDismissMs.phone - 1000))
    act(() => api().showError('Mislukt'))

    expect(within(region()).getAllByText('Mislukt')).toHaveLength(1)

    act(() => vi.advanceTimersByTime(1000))
    expect(within(region()).getByText('Mislukt')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(toastAutoDismissMs.phone))
    expect(region()).toBeEmptyDOMElement()
  })

  it('ruimt met clearSource alleen de toasts van die bron op', () => {
    const { api } = renderProvider()

    act(() => {
      api().showError('Hubfout', 'hub')
      api().showError('Andere fout')
    })
    act(() => api().clearSource('hub'))

    expect(within(region()).queryByText('Hubfout')).not.toBeInTheDocument()
    expect(within(region()).getByText('Andere fout')).toBeInTheDocument()
  })

  it('sluit een toast via dismiss, los van latere toasts', () => {
    const { api } = renderProvider()

    // Ids beginnen per provider bij 1.
    act(() => api().showError('Eerste'))
    act(() => api().dismiss(1))
    expect(region()).toBeEmptyDOMElement()

    act(() => api().showError('Tweede'))
    act(() => vi.advanceTimersByTime(toastAutoDismissMs.phone - 1))
    expect(within(region()).getByText('Tweede')).toBeInTheDocument()
  })

  it('ruimt openstaande timers op bij unmount', () => {
    const { api, unmount } = renderProvider()

    act(() => api().showError('Mislukt'))
    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
