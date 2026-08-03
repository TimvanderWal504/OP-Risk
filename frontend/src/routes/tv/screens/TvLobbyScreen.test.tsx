import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TvLobbyScreen } from './TvLobbyScreen'
import { fixtureState } from './tvScreenFixture'

describe('TvLobbyScreen', () => {
  it('toont de wachtkamer met de spelers die al binnen zijn', () => {
    render(<TvLobbyScreen state={fixtureState} orderRollThrows={{}} lastClaimedTerritoryId={null} />)

    expect(screen.getByText('Wachtkamer')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })
})
