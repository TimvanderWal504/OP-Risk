import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GameInfoPanel } from './GameInfoPanel'
import { fixtureState } from '../routes/phone/screens/phoneScreenFixture'

const me = fixtureState.players[0]

describe('GameInfoPanel', () => {
  it('opent op de stand en wisselt naar de regels', async () => {
    render(<GameInfoPanel state={fixtureState} me={me} onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Spelinfo' })).toBeInTheDocument()
    expect(screen.getByText('(Jij)')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Regels' }))

    expect(screen.getByText('Versterken')).toBeInTheDocument()
    expect(screen.queryByText('(Jij)')).not.toBeInTheDocument()
  })

  it('toont het tabblad Rollen alleen als rollen aan staan', () => {
    const { unmount } = render(<GameInfoPanel state={fixtureState} me={me} onClose={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Rollen' })).not.toBeInTheDocument()
    unmount()

    const withRoles = { ...fixtureState, settings: { ...fixtureState.settings, rolesEnabled: true } }
    render(<GameInfoPanel state={withRoles} me={me} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Rollen' })).toBeInTheDocument()
  })

  it('sluit via "Sluiten"', async () => {
    const onClose = vi.fn()
    render(<GameInfoPanel state={fixtureState} me={me} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Sluiten' }))

    expect(onClose).toHaveBeenCalled()
  })
})
