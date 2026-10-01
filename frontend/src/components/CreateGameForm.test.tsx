import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'
import { CreateGameForm } from './CreateGameForm'
import { ToastProvider } from '../hooks/ToastProvider'
import { DefenseDiceRuleDto, type MapSummaryDto } from '../types/GameSettings'
import { TvLanguageDto } from '../types/TvDisplay'
import { readRememberedTvDisplay } from '../storage/rememberedTvDisplay'

vi.mock('../storage/rememberedTvDisplay', () => ({ readRememberedTvDisplay: vi.fn(() => null) }))

const MAPS: MapSummaryDto[] = [
  { mapId: 'standaard-43', isDefault: true, territoryCount: 43, continentCount: 6, defaultStartingArmiesPresetId: 'classic' },
  { mapId: 'wereld-49', isDefault: false, territoryCount: 49, continentCount: 6, defaultStartingArmiesPresetId: 'classic-49' },
]

const PRESETS = [
  { id: 'classic', armiesByPlayerCount: { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20, 7: 18 } },
  { id: 'classic-49', armiesByPlayerCount: { 2: 50, 3: 45, 4: 40, 5: 35, 6: 30, 7: 27 } },
]

interface ServerOptions {
  /** Antwoord op `POST /games`. */
  post?: { ok: boolean; json: () => Promise<unknown> }
  /** `false`: `GET /maps` faalt. */
  mapsOk?: boolean
}

/** Nep-server per URL, zodat de volgorde van de fetches er niet toe doet. */
function mockServer({ post = { ok: true, json: async () => ({ gameId: 'ABC123' }) }, mapsOk = true }: ServerOptions = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === '/maps') return mapsOk ? { ok: true, json: async () => MAPS } : { ok: false, json: async () => null }
    if (url.endsWith('/starting-armies-presets')) return { ok: true, json: async () => PRESETS }
    if (url === '/games') return post
    throw new Error(`onverwachte fetch: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** De body van het `POST /games`-verzoek. */
function postedRequest(fetchMock: ReturnType<typeof mockServer>) {
  const call = fetchMock.mock.calls.find(([url]) => url === '/games') as unknown as [string, RequestInit] | undefined
  return JSON.parse(call?.[1].body as string)
}

// Fouten verschijnen als toast; het formulier heeft daarvoor de provider nodig.
const renderWithToasts = (ui: ReactElement) => render(<ToastProvider device="phone">{ui}</ToastProvider>)

async function renderLoaded(onCreated: (gameId: string) => void | Promise<void> = vi.fn()) {
  renderWithToasts(<CreateGameForm onCreated={onCreated} />)
  await waitFor(() => expect(screen.getByRole('radio', { name: /^Klassiek(?!-)/ })).toBeInTheDocument())
}

describe('CreateGameForm', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('post naar /games en levert de gameId bij succes', async () => {
    const fetchMock = mockServer()
    const onCreated = vi.fn()

    await renderLoaded(onCreated)
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('ABC123'))
    expect(fetchMock).toHaveBeenCalledWith('/games', expect.objectContaining({ method: 'POST' }))
  })

  it('blijft bezig zolang de aanroeper na het aanmaken nog bezig is (geen tweede spel)', async () => {
    mockServer()
    let finish: () => void = () => {}
    const onCreated = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))

    await renderLoaded(onCreated)
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('ABC123'))
    expect(screen.getByRole('button', { name: 'Bezig…' })).toBeDisabled()

    finish()
    await waitFor(() => expect(screen.getByRole('button', { name: /spel aanmaken/i })).toBeEnabled())
  })

  it('selecteert de standaardkaart en toont die in de kopregel (FO §10)', async () => {
    const fetchMock = mockServer()

    await renderLoaded()

    expect(screen.getByRole('radio', { name: /^Standaard/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /^Wereld/ })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('Standaard · 43 gebieden · 6 continenten')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/maps/standaard-43/starting-armies-presets')

    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(postedRequest(fetchMock).mapId).toBe('standaard-43'))
    expect(postedRequest(fetchMock).settings.startingArmiesPresetId).toBe('classic')
  })

  it('zet bij een andere kaart de startlegers op de standaard van die kaart (FO §10)', async () => {
    const fetchMock = mockServer()

    await renderLoaded()
    await userEvent.click(screen.getByRole('radio', { name: /^Wereld/ }))

    expect(screen.getByRole('radio', { name: /^Wereld/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /^Klassiek-49/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Wereld · 49 gebieden · 6 continenten')).toBeInTheDocument()
    expect(screen.getByText(/^49 gebieden, met onder meer Hawaï/)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/maps/wereld-49/starting-armies-presets'))

    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(postedRequest(fetchMock).mapId).toBe('wereld-49'))
    expect(postedRequest(fetchMock).settings.startingArmiesPresetId).toBe('classic-49')
  })

  it('laat een zelfgekozen preset staan tot de host een andere kaart kiest', async () => {
    const fetchMock = mockServer()

    await renderLoaded()
    await userEvent.click(screen.getByRole('radio', { name: /^Klassiek-49/ }))
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(postedRequest(fetchMock).settings.startingArmiesPresetId).toBe('classic-49'))
    expect(postedRequest(fetchMock).mapId).toBe('standaard-43')
  })

  it('kan zonder kaartlijst geen spel aanmaken en meldt dat', async () => {
    mockServer({ mapsOk: false })

    renderWithToasts(<CreateGameForm onCreated={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Kon geen verbinding maken met de server.'))
    expect(screen.getByRole('button', { name: /spel aanmaken/i })).toBeDisabled()
  })

  it('stuurt standaard de Huisregel mee, en Klassiek na die keuze (FO §10)', async () => {
    const fetchMock = mockServer()

    await renderLoaded()

    expect(screen.getByText('Gooit de aanvaller met 1 dobbelsteen, dan verdedig je ook met 1.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Klassiek' }))

    expect(screen.getByText(/Verdedigingsrollen doen niet mee/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(postedRequest(fetchMock).settings.defenseDiceRule).toBe(DefenseDiceRuleDto.Classic))
  })

  it('stuurt de onthouden TV-weergave van deze telefoon mee, of null zonder (plan-testronde-tv punt 2)', async () => {
    const remembered = { textScale: 65, glassOpacity: 40, glassBlur: 90, language: TvLanguageDto.En, diceScale: 35 }
    vi.mocked(readRememberedTvDisplay).mockReturnValueOnce(remembered)
    const fetchMock = mockServer()

    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(postedRequest(fetchMock).tvDisplay).toEqual(remembered))
  })

  it('zet rollen en gebeurtenisronde standaard uit, zoals FO §9/§10', async () => {
    const fetchMock = mockServer()

    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(postedRequest(fetchMock).settings.rolesEnabled).toBe(false))
    expect(postedRequest(fetchMock).settings.eventsEnabled).toBe(false)
  })

  it('stuurt tvDisplay null mee zolang deze telefoon niets onthouden heeft', async () => {
    const fetchMock = mockServer()

    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(postedRequest(fetchMock).tvDisplay).toBeNull())
  })

  it('toont een vertaalde fouttoast als de server het verzoek weigert', async () => {
    mockServer({ post: { ok: false, json: async () => [{ code: 'lobby.gameFull' }] } })

    await renderLoaded()
    await userEvent.click(screen.getByRole('button', { name: /spel aanmaken/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Dit spel zit vol.'))
  })
})
