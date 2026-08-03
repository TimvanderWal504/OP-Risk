import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvOrderRollScreen } from './TvOrderRollScreen'
import { fixtureState } from './tvScreenFixture'

describe('TvOrderRollScreen', () => {
  it('toont de worpen en de bepaalde speelvolgorde', () => {
    render(
      <TvOrderRollScreen
        state={fixtureState}
        orderRollThrows={{ alice: [4, 5], bob: [2, 3] }}
        lastClaimedTerritoryId={null}
      />,
    )

    // Elke naam staat twee keer op het scherm: bij zijn eigen worp én in de volgordelijst
    // eronder (Host-scherm.dc.html, `isOrder`).
    expect(screen.getAllByText('Alice')).toHaveLength(2)
    expect(screen.getAllByText('Bob')).toHaveLength(2)
    expect(screen.getByText('Speelvolgorde')).toBeInTheDocument()
  })

  it('toont geen volgordelijst zolang de server er nog geen bepaald heeft', () => {
    render(
      <TvOrderRollScreen
        state={{ ...fixtureState, turnOrder: [] }}
        orderRollThrows={{ alice: [4, 5] }}
        lastClaimedTerritoryId={null}
      />,
    )

    expect(screen.getAllByText('Alice')).toHaveLength(1)
    expect(screen.queryByText('Speelvolgorde')).not.toBeInTheDocument()
  })
})
