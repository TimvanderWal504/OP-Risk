import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MapSummaryDto } from '../types/GameSettings'
import { ToastProvider } from './ToastProvider'
import { useMapChoice } from './useMapChoice'

const standaard: MapSummaryDto = {
  mapId: 'standaard-43',
  isDefault: true,
  territoryCount: 43,
  continentCount: 6,
  defaultStartingArmiesPresetId: 'classic',
}
const wereld: MapSummaryDto = {
  mapId: 'wereld-49',
  isDefault: false,
  territoryCount: 49,
  continentCount: 6,
  defaultStartingArmiesPresetId: 'classic-49',
}

function mockMaps(maps: MapSummaryDto[] | null) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === '/maps') return maps ? { ok: true, json: async () => maps } : { ok: false, json: async () => null }
    return { ok: true, json: async () => [] }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider device="phone">{children}</ToastProvider>

describe('useMapChoice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('kiest de standaardkaart voor en meldt die als gekozen', async () => {
    mockMaps([wereld, standaard])
    const onMapChosen = vi.fn()

    const { result } = renderHook(() => useMapChoice({ onMapChosen, toastSource: 'test' }), { wrapper })

    await waitFor(() => expect(result.current.selectedMap).toEqual(standaard))
    expect(onMapChosen).toHaveBeenCalledWith(standaard)
  })

  it('valt terug op de eerste kaart als er geen standaardkaart is', async () => {
    mockMaps([{ ...wereld }, { ...standaard, isDefault: false }])

    const { result } = renderHook(() => useMapChoice({ onMapChosen: vi.fn(), toastSource: 'test' }), { wrapper })

    await waitFor(() => expect(result.current.selectedMap?.mapId).toBe('wereld-49'))
  })

  it('laadt de presets van de gekozen kaart en meldt elke nieuwe keuze', async () => {
    const fetchMock = mockMaps([standaard, wereld])
    const onMapChosen = vi.fn()

    const { result } = renderHook(() => useMapChoice({ onMapChosen, toastSource: 'test' }), { wrapper })
    await waitFor(() => expect(result.current.selectedMap).toEqual(standaard))

    act(() => result.current.selectMap(wereld))

    expect(result.current.selectedMap).toEqual(wereld)
    expect(onMapChosen).toHaveBeenLastCalledWith(wereld)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/maps/wereld-49/starting-armies-presets'))
  })

  it.each([
    ['een mislukte kaartlijst', null],
    ['een lege kaartlijst', []],
  ])('toont een fouttoast bij %s en kiest niets', async (_case, maps) => {
    mockMaps(maps)

    function Probe() {
      const { selectedMap } = useMapChoice({ onMapChosen: vi.fn(), toastSource: 'test' })
      return <span>{selectedMap ? 'gekozen' : 'geen kaart'}</span>
    }
    render(<Probe />, { wrapper })

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Kon geen verbinding maken met de server.'))
    expect(screen.getByText('geen kaart')).toBeInTheDocument()
  })
})
