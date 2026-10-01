import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EventDurationDto, EventEffectKindDto } from '../types/GameState'
import { fixtureState } from '../routes/tv/screens/tvScreenFixture'
import { ActiveEffectChip } from './ActiveEffectChip'

describe('ActiveEffectChip', () => {
  it('toont kicker en naam van het lopende effect, zonder duur-badge', () => {
    render(
      <ActiveEffectChip
        state={{
          ...fixtureState,
          events: [{ id: 'stormachtige-zeeen', duration: EventDurationDto.OneRound, effectKind: EventEffectKindDto.SeaBlockade, amount: null }],
          activeEffect: { eventId: 'stormachtige-zeeen', lockedTerritoryIds: [], blockedBorders: [] },
        }}
      />,
    )

    expect(screen.getByText('Actief effect')).toBeInTheDocument()
    expect(screen.getByText('Stormachtige zeeën')).toBeInTheDocument()
    // De duur-badge "tot volgende ronde" is weggehaald (besluit gebruiker 2026-10-01).
    expect(screen.queryByText('tot volgende ronde')).not.toBeInTheDocument()
  })

  it('rendert niets zonder lopend effect', () => {
    const { container } = render(<ActiveEffectChip state={fixtureState} />)

    expect(container).toBeEmptyDOMElement()
  })
})
