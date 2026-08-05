import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DefendStep } from './DefendStep'

const attackerColor = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' }
const myColor = { id: 'blue', name: 'Blauw', hex: '#2980b9', onHex: '#fff', symbol: 'square' }

describe('DefendStep', () => {
  it('grijst "2 dobbelstenen" uit zodra het gebied nog maar 1 leger heeft', () => {
    render(
      <DefendStep
        attackerName="Alice"
        attackerColor={attackerColor}
        myColor={myColor}
        fromTerritoryId="alaska"
        toTerritoryId="kamchatka"
        defenderArmyCount={1}
        onChooseDefenseDice={vi.fn()}
      />,
    )

    expect(screen.getByText('2').closest('button')).toBeDisabled()
    expect(screen.getByText('1').closest('button')).not.toBeDisabled()
  })

  it('toont het resultaat rechtstreeks uit de invoke-respons, zonder broadcast nodig te hebben', async () => {
    const user = userEvent.setup()
    const onChooseDefenseDice = vi.fn().mockResolvedValue({
      attackerRolls: [4],
      defenderRolls: [6],
      attackerLosses: 1,
      defenderLosses: 0,
      conquered: false,
      state: {},
    })

    render(
      <DefendStep
        attackerName="Alice"
        attackerColor={attackerColor}
        myColor={myColor}
        fromTerritoryId="alaska"
        toTerritoryId="kamchatka"
        defenderArmyCount={3}
        onChooseDefenseDice={onChooseDefenseDice}
      />,
    )

    await user.click(screen.getByText('2'))

    expect(onChooseDefenseDice).toHaveBeenCalledWith(2)
    expect(await screen.findByText('Je hield stand — aanvaller −1')).toBeInTheDocument()
  })
})
