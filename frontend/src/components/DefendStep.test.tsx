import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DefendStep } from './DefendStep'

const attackerColor = { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' }
const myColor = { id: 'blue', name: 'Blauw', hex: '#2980b9', onHex: '#fff', symbol: 'square' }

describe('DefendStep', () => {
  it('toont de wachtregel en grijst de keuzeknoppen uit zolang de aanvaller een herwerp-beslissing openheeft (B6)', () => {
    render(
      <DefendStep
        attackerName="Alice"
        attackerColor={attackerColor}
        myColor={myColor}
        fromTerritoryId="alaska"
        toTerritoryId="kamchatka"
        defenderArmyCount={3}
        attackerArmyCount={5}
        awaitingRerollDecision={true}
        houseRuleLimitsToOneDie={false}
        defenseBoostRoleId={null}
        onChooseDefenseDice={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('Aanvaller overweegt een herwerp…')).toBeInTheDocument()
    expect(screen.queryByText('Verdedig dit gebied.')).not.toBeInTheDocument()
    expect(screen.getByText('1').closest('button')).toBeDisabled()
    expect(screen.getByText('2').closest('button')).toBeDisabled()
  })

  it('toont de legerstand van verdediger en aanvaller onder de kleurblokken', () => {
    render(
      <DefendStep
        attackerName="Alice"
        attackerColor={attackerColor}
        myColor={myColor}
        fromTerritoryId="alaska"
        toTerritoryId="kamchatka"
        defenderArmyCount={3}
        attackerArmyCount={5}
        awaitingRerollDecision={false}
        houseRuleLimitsToOneDie={false}
        defenseBoostRoleId={null}
        onChooseDefenseDice={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('Jouw legers op Kamtsjatka: 3', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Aanvaller vanuit Alaska: 5', { exact: false })).toBeInTheDocument()
  })

  it('verbergt de legerstand-regel zodra het resultaat verschijnt — anders toont hij een verouderd aantal naast de uitkomst', async () => {
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
        attackerArmyCount={5}
        awaitingRerollDecision={false}
        houseRuleLimitsToOneDie={false}
        defenseBoostRoleId={null}
        onChooseDefenseDice={onChooseDefenseDice}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('Jouw legers op Kamtsjatka: 3', { exact: false })).toBeInTheDocument()

    await user.click(screen.getByText('2'))
    await screen.findByText('Je verslaat 1 leger')

    expect(screen.queryByText('Jouw legers op Kamtsjatka: 3', { exact: false })).not.toBeInTheDocument()
  })

  it('grijst "2 dobbelstenen" uit zodra het gebied nog maar 1 leger heeft', () => {
    render(
      <DefendStep
        attackerName="Alice"
        attackerColor={attackerColor}
        myColor={myColor}
        fromTerritoryId="alaska"
        toTerritoryId="kamchatka"
        defenderArmyCount={1}
        attackerArmyCount={5}
        awaitingRerollDecision={false}
        houseRuleLimitsToOneDie={false}
        defenseBoostRoleId={null}
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
        attackerArmyCount={5}
        awaitingRerollDecision={false}
        houseRuleLimitsToOneDie={false}
        defenseBoostRoleId={null}
        onChooseDefenseDice={onChooseDefenseDice}
        onDismiss={vi.fn()}
      />,
    )

    await user.click(screen.getByText('2'))

    expect(onChooseDefenseDice).toHaveBeenCalledWith(2, false)
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
        attackerArmyCount={5}
        awaitingRerollDecision={false}
        houseRuleLimitsToOneDie={false}
        defenseBoostRoleId={null}
        onChooseDefenseDice={onChooseDefenseDice}
        onDismiss={onDismiss}
      />,
    )

    await user.click(screen.getByText('2'))
    await screen.findByText('Je verslaat 1 leger')

    await user.click(screen.getByText('Terug naar het spel'))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  describe('Dobbelregel Huisregel (FO §5.3 stap 4) en DefenseBoost-rol (FO §8.1)', () => {
    const renderHouseRule = (defenseBoostRoleId: string | null, onChooseDefenseDice = vi.fn(), defenderArmyCount = 3) =>
      render(
        <DefendStep
          attackerName="Alice"
          attackerColor={attackerColor}
          myColor={myColor}
          fromTerritoryId="alaska"
          toTerritoryId="kamchatka"
          defenderArmyCount={defenderArmyCount}
          attackerArmyCount={5}
          awaitingRerollDecision={false}
          houseRuleLimitsToOneDie={true}
          defenseBoostRoleId={defenseBoostRoleId}
          onChooseDefenseDice={onChooseDefenseDice}
          onDismiss={vi.fn()}
        />,
      )

    it('grijst "2 dobbelstenen" uit en legt de huisregel uit zonder beschikbare boost', () => {
      renderHouseRule(null)

      expect(screen.getByText('2').closest('button')).toBeDisabled()
      expect(screen.getByText('1').closest('button')).not.toBeDisabled()
      expect(screen.getByText('De aanvaller gooit met 1 dobbelsteen — volgens de huisregel verdedig je dan ook met 1.')).toBeInTheDocument()
    })

    it('houdt "2 dobbelstenen" klikbaar met de rolnaam als de boost beschikbaar is, en zet de boost in', async () => {
      const user = userEvent.setup()
      const onChooseDefenseDice = vi.fn().mockResolvedValue({
        attackerRolls: [4],
        defenderRolls: [6, 5],
        attackerLosses: 1,
        defenderLosses: 0,
        conquered: false,
        state: {},
      })

      renderHouseRule('capoeirista', onChooseDefenseDice)

      expect(screen.getByText('Capoeirista: verdedig deze ronde één keer toch met 2 dobbelstenen.')).toBeInTheDocument()
      expect(screen.getByText('2').closest('button')).not.toBeDisabled()

      await user.click(screen.getByText('2'))

      expect(onChooseDefenseDice).toHaveBeenCalledWith(2, true)
    })

    it('zet de boost niet in bij een keuze voor 1 dobbelsteen', async () => {
      const user = userEvent.setup()
      const onChooseDefenseDice = vi.fn().mockResolvedValue(undefined)

      renderHouseRule('capoeirista', onChooseDefenseDice)
      await user.click(screen.getByText('1'))

      expect(onChooseDefenseDice).toHaveBeenCalledWith(1, false)
    })

    it('biedt de boost niet aan bij maar 1 leger — die harde regel gaat voor', () => {
      renderHouseRule('capoeirista', vi.fn(), 1)

      expect(screen.getByText('2').closest('button')).toBeDisabled()
      expect(screen.queryByText('Capoeirista: verdedig deze ronde één keer toch met 2 dobbelstenen.')).not.toBeInTheDocument()
    })
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
        attackerArmyCount={5}
        awaitingRerollDecision={false}
        houseRuleLimitsToOneDie={false}
        defenseBoostRoleId={null}
        onChooseDefenseDice={onChooseDefenseDice}
        onDismiss={vi.fn()}
      />,
    )

    await user.click(screen.getByText('2'))

    expect(await screen.findByText(expectedText)).toBeInTheDocument()
  })
})
