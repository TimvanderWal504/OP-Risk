import { createElement, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useReportOnce } from './useReportOnce'
import { useToastList } from './useToastList'
import { useToast } from './useToast'

function renderReportOnce() {
  const wrapper = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device: 'tv', children })
  const { result } = renderHook(() => ({ once: useReportOnce('bron'), list: useToastList() }), { wrapper })

  return { once: () => result.current.once, messages: () => result.current.list.toasts.map((toast) => toast.message) }
}

describe('useReportOnce', () => {
  it('meldt alleen de eerste fout tot het weer lukt', () => {
    const { once, messages } = renderReportOnce()

    act(() => once().report('Eerste'))
    act(() => once().report('Tweede'))

    expect(messages()).toEqual(['Eerste'])
  })

  it('ruimt bij succes de toast op en meldt een volgende fout opnieuw', () => {
    const { once, messages } = renderReportOnce()

    act(() => once().report('Mislukt'))
    act(() => once().resolved())
    expect(messages()).toEqual([])

    act(() => once().report('Weer mislukt'))
    expect(messages()).toEqual(['Weer mislukt'])
  })

  it('ruimt alleen toasts van de eigen bron op', () => {
    const wrapper = ({ children }: { children: ReactNode }) => createElement(ToastProvider, { device: 'tv', children })
    const { result } = renderHook(
      () => ({ once: useReportOnce('bron'), toast: useToast(), list: useToastList() }),
      { wrapper },
    )

    act(() => {
      result.current.toast.showError('Van elders', 'anders')
      result.current.once.report('Eigen fout')
    })
    act(() => result.current.once.resolved())

    expect(result.current.list.toasts.map((toast) => toast.message)).toEqual(['Van elders'])
  })
})
