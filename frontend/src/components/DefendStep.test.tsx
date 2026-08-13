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
        onDismiss={vi.fn()}
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
        onDismiss={vi.fn()}
      />,
    )

    await user.click(screen.getByText('2'))

    expect(onChooseDefenseDice).toHaveBeenCalledWith(2)
    expect(await screen.findByText('Je verslaat 1 leger')).toBeInTheDocument()
  })

  it('roept onDismiss aan i.p.v. lokaal het resultaat te wissen — de ouder beslist of het scherm verdwijnt', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
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
        onDismiss={onDismiss}
      />,
    )

    await user.click(screen.getByText('2'))
    await screen.findByText('Je verslaat 1 leger')

    await user.click(screen.getByText('Terug naar het spel'))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it.each<[string, { attackerLosses: number; defenderLosses: number; conquered: boolean }, string]>([
    ['jij verliest legers maar het gebied blijft van jou', { attackerLosses: 0, defenderLosses: 2, conquered: false }, 'Je verliest 2 legers'],
    ['gemengde uitslag — altijd 1-om-1', { attackerLosses: 1, defenderLosses: 1, conquered: false }, 'Jullie verliezen allebei 1 leger'],
    ['gebied verloren', { attackerLosses: 0, defenderLosses: 1, conquered: true }, 'Je verliest het gebied'],
  ])('toont een verhalende uitkomstregel vanuit de verdediger: %s', async (_label, losses, expectedText) => {
    const user = userEvent.setup()
    const onChooseDefenseDice = vi.fn().mockResolvedValue({
      attackerRolls: [4],
      defenderRolls: [2, 3],
      ...losses,
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
        onDismiss={vi.fn()}
      />,
    )

    await user.click(screen.getByText('2'))

    expect(await screen.findByText(expectedText)).toBeInTheDocument()
  })
})
