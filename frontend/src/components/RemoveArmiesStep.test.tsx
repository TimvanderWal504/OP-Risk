import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TerritoryCatalogDto } from '../types/TerritoryCatalog'
import { RemoveArmiesStep } from './RemoveArmiesStep'

const catalog: TerritoryCatalogDto[] = [
  { id: 'alaska', continent: 'north-america', neighborTerritoryIds: [] },
  { id: 'alberta', continent: 'north-america', neighborTerritoryIds: [] },
  { id: 'peru', continent: 'south-america', neighborTerritoryIds: [] },
]

const renderStep = (onConfirm = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <RemoveArmiesStep
      eventId="griepgolf"
      amount={2}
      myTerritories={[
        { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 3 },
        { territoryId: 'alberta', ownerPlayerId: 'alice', armyCount: 2 },
        { territoryId: 'peru', ownerPlayerId: 'alice', armyCount: 1 },
      ]}
      myColor={null}
      territoryCatalog={catalog}
      onConfirm={onConfirm}
    />,
  )
  return onConfirm
}

describe('RemoveArmiesStep', () => {
  it('toont titel, kaart en alleen de gebieden die een leger kunnen missen', () => {
    renderStep()

    expect(screen.getByText('Verwijder 2 legers')).toBeInTheDocument()
    expect(screen.getByText('Griepgolf')).toBeInTheDocument()
    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.getByText('Alberta')).toBeInTheDocument()
    expect(screen.queryByText('Peru')).not.toBeInTheDocument()
    expect(screen.getByText('1 gebied met 1 leger kan niets missen.')).toBeInTheDocument()
  })

  it('bevestigt pas als het totaal klopt, en stuurt de afgestane legers per gebied', async () => {
    const onConfirm = renderStep()
    const confirm = screen.getByRole('button', { name: 'Bevestigen' })

    expect(confirm).toBeDisabled()

    const rows = screen.getAllByRole('button', { name: '−' })
    fireEvent.click(rows[0])
    expect(confirm).toBeDisabled()
    fireEvent.click(rows[0])
    expect(confirm).toBeEnabled()

    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledWith({ alaska: 2 })
  })

  it('laat een gebied nooit onder 1 leger komen', () => {
    renderStep()

    const [, albertaMinus] = screen.getAllByRole('button', { name: '−' })
    fireEvent.click(albertaMinus)

    expect(albertaMinus).toBeDisabled()
  })

  it('verstuurt een keuze maar één keer, ook bij een dubbele tik', async () => {
    let resolve!: () => void
    const onConfirm = renderStep(vi.fn().mockReturnValue(new Promise<void>((r) => (resolve = r))))
    const [alaskaMinus] = screen.getAllByRole('button', { name: '−' })
    fireEvent.click(alaskaMinus)
    fireEvent.click(alaskaMinus)

    const confirm = screen.getByRole('button', { name: 'Bevestigen' })
    fireEvent.click(confirm)
    expect(confirm).toBeDisabled()
    fireEvent.click(confirm)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    await act(async () => resolve())
  })
})
