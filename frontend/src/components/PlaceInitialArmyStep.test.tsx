import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlaceInitialArmyStep } from './PlaceInitialArmyStep'

const myColor = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' }

describe('PlaceInitialArmyStep', () => {
  it('roept onPlace aan met het territoryId als op + wordt getikt', async () => {
    const onPlace = vi.fn()
    render(
      <PlaceInitialArmyStep
        myTerritories={[{ territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 2 }]}
        myColor={myColor}
        armiesLeft={3}
        onPlace={onPlace}
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    expect(onPlace).toHaveBeenCalledWith('alaska')
  })

  it('schakelt de +-knop uit zodra er geen legers meer te plaatsen zijn', () => {
    render(
      <PlaceInitialArmyStep
        myTerritories={[{ territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 5 }]}
        myColor={myColor}
        armiesLeft={0}
        onPlace={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: '+' })).toBeDisabled()
  })
})
