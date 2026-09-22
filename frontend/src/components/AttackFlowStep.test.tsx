import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AttackFlowStep } from './AttackFlowStep'

const players = [
  { id: 'alice', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false, hand: [], hasTradeableCardSet: false, handCount: 0, missionId: null },
  { id: 'bob', name: 'Bob', colorId: 'blue', roleId: null, isHost: false, isEliminated: false, hand: [], hasTradeableCardSet: false, handCount: 0, missionId: null },
]

const colors = [
  { id: 'red', name: 'Rood', hex: '#c0392b', onHex: '#fff', symbol: 'circle' },
  { id: 'blue', name: 'Blauw', hex: '#2980b9', onHex: '#fff', symbol: 'square' },
]

const territoryCatalog = [
  { id: 'alaska', continent: 'north-america', neighborTerritoryIds: ['kamchatka'] },
  { id: 'kamchatka', continent: 'asia', neighborTerritoryIds: ['alaska'] },
  { id: 'brazil', continent: 'south-america', neighborTerritoryIds: [] },
]

const territories = [
  { territoryId: 'alaska', ownerPlayerId: 'alice', armyCount: 4 },
  { territoryId: 'kamchatka', ownerPlayerId: 'bob', armyCount: 2 },
  { territoryId: 'brazil', ownerPlayerId: 'alice', armyCount: 1 },
]

const myColor = colors[0]

describe('AttackFlowStep', () => {
  it('toont alleen eigen gebieden met minstens 2 legers en een vijandelijke buur als bron', () => {
    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territories}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={null}
        combat={null}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={vi.fn()}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.queryByText('Brazilië')).not.toBeInTheDocument()
  })

  it('roept onEndPhase aan vanuit de bronkeuze, want aanvallen is optioneel (FO §5.3)', async () => {
    const user = userEvent.setup()
    const onEndPhase = vi.fn().mockResolvedValue(undefined)

    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territories}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={null}
        combat={null}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={vi.fn()}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={onEndPhase}
      />,
    )

    await user.click(screen.getByText('Aanvalsfase beëindigen'))

    expect(onEndPhase).toHaveBeenCalled()
  })

  it('doorloopt bron → doel → dobbelstenen en roept onDeclareAttack aan bij "Gooi"', async () => {
    const user = userEvent.setup()
    const onDeclareAttack = vi.fn().mockResolvedValue(undefined)

    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territories}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={null}
        combat={null}
        onDeclareAttack={onDeclareAttack}
        onAbandonAttack={vi.fn()}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    await user.click(screen.getByText('Alaska'))
    await user.click(screen.getByText('Kamtsjatka'))
    await user.click(screen.getByText('2', { selector: 'span.font-display' }))
    await user.click(screen.getByRole('button', { name: /Gooi/ }))

    expect(onDeclareAttack).toHaveBeenCalledWith('alaska', 'kamchatka', 2)
  })

  it('start meteen op het resultaatscherm bij een reeds actief pendingCombat (reconnect middenin een aanval)', () => {
    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territories}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={{ fromTerritoryId: 'alaska', toTerritoryId: 'kamchatka', attackDice: 2, attackerRolls: [5, 3], awaitingRerollDecision: false }}
        combat={{ correlationId: 'c1', attackerRolls: [5, 3], defenderRolls: null, reroll: null, narrated: null }}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={vi.fn()}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    // "Aanvallen vanuit" komt ook voor als staplabel in de stap-indicator (altijd zichtbaar,
    // ongeacht fase) — de subtitel van de bron-picker is wél uniek voor die stap.
    expect(screen.queryByText('Kies een van je gebieden dat kan aanvallen.')).not.toBeInTheDocument()
    expect(screen.getByText('Uitkomst')).toBeInTheDocument()
  })

  describe('rol-herwerp (plan-rollen taak 5, B1/B2)', () => {
    const rerollPendingCombat = {
      fromTerritoryId: 'alaska',
      toTerritoryId: 'kamchatka',
      attackDice: 2,
      attackerRolls: [4, 2],
      awaitingRerollDecision: true,
    }
    const rerollCombat = { correlationId: 'c1', attackerRolls: [4, 2], defenderRolls: null, reroll: null, narrated: null }

    it('toont het herwerp-aanbod i.p.v. de kale wachtstip zolang de beslissing openstaat, en roept onRerollAttackDie aan met de gekozen dobbelsteen', async () => {
      const user = userEvent.setup()
      const onRerollAttackDie = vi.fn().mockResolvedValue(undefined)

      render(
        <AttackFlowStep
          playerId="alice"
          myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
          territories={territories}
          territoryCatalog={territoryCatalog}
          players={players}
          colors={colors}
          myColor={myColor}
          pendingCombat={rerollPendingCombat}
          combat={rerollCombat}
          onDeclareAttack={vi.fn()}
          onAbandonAttack={vi.fn()}
          onRerollAttackDie={onRerollAttackDie}
          onKeepAttackDice={vi.fn()}
          onEndPhase={vi.fn()}
        />,
      )

      expect(screen.getByText('Herwerp een dobbelsteen voordat de verdediger gooit')).toBeInTheDocument()

      const confirmButton = screen.getByRole('button', { name: 'Herwerpen' })
      expect(confirmButton).toBeDisabled()

      // Twee worp-dobbelstenen (waarden 4 en 2) — tik de tweede aan (dieIndex 1).
      const dice = screen.getAllByRole('img')
      expect(dice).toHaveLength(2)
      await user.click(dice[1])

      expect(confirmButton).not.toBeDisabled()
      await user.click(confirmButton)

      expect(onRerollAttackDie).toHaveBeenCalledWith(1)
    })

    it('roept onKeepAttackDice aan bij "Doorgaan", zonder dat er een dobbelsteen gekozen hoeft te zijn', async () => {
      const user = userEvent.setup()
      const onKeepAttackDice = vi.fn().mockResolvedValue(undefined)

      render(
        <AttackFlowStep
          playerId="alice"
          myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
          territories={territories}
          territoryCatalog={territoryCatalog}
          players={players}
          colors={colors}
          myColor={myColor}
          pendingCombat={rerollPendingCombat}
          combat={rerollCombat}
          onDeclareAttack={vi.fn()}
          onAbandonAttack={vi.fn()}
          onRerollAttackDie={vi.fn()}
          onKeepAttackDice={onKeepAttackDice}
          onEndPhase={vi.fn()}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Doorgaan' }))

      expect(onKeepAttackDice).toHaveBeenCalled()
    })

    it('toont de kale wachtstip i.p.v. het herwerp-aanbod zodra de beslissing gesloten is', () => {
      render(
        <AttackFlowStep
          playerId="alice"
          myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
          territories={territories}
          territoryCatalog={territoryCatalog}
          players={players}
          colors={colors}
          myColor={myColor}
          pendingCombat={{ ...rerollPendingCombat, awaitingRerollDecision: false }}
          combat={rerollCombat}
          onDeclareAttack={vi.fn()}
          onAbandonAttack={vi.fn()}
          onRerollAttackDie={vi.fn()}
          onKeepAttackDice={vi.fn()}
          onEndPhase={vi.fn()}
        />,
      )

      expect(screen.queryByText('Herwerp een dobbelsteen voordat de verdediger gooit')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Herwerpen' })).not.toBeInTheDocument()
    })
  })

  it('toont het resultaat en de vervolgacties zodra CombatNarrated binnen is', async () => {
    const user = userEvent.setup()
    const onEndPhase = vi.fn().mockResolvedValue(undefined)

    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territories}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={null}
        combat={{
          correlationId: 'c1',
          attackerRolls: [5, 3],
          defenderRolls: [4],
          reroll: null,
          narrated: {
            correlationId: 'c1',
            attackerId: 'alice',
            defenderId: 'bob',
            fromTerritoryId: 'alaska',
            toTerritoryId: 'kamchatka',
            attackerLosses: 1,
            defenderLosses: 0,
            conquered: false,
            eliminatedPlayerId: null,
            stateVersion: 3,
          },
        }}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={vi.fn()}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={onEndPhase}
      />,
    )

    expect(screen.getByText('Jij verliest 1 leger')).toBeInTheDocument()

    await user.click(screen.getByText('Naar Verplaatsen', { exact: false }))
    expect(onEndPhase).toHaveBeenCalled()
  })

  // Alle uitkomsten die FO §5.3.5 kan opleveren: elk vergeleken dobbelsteenpaar kost precies één
  // kant één leger en er zijn er hooguit twee, dus 1-om-0, 2-om-0, 0-om-1, 0-om-2 en 1-om-1.
  it.each([
    [0, 1, 'Jij verslaat 1 leger'],
    [0, 2, 'Jij verslaat 2 legers'],
    [1, 0, 'Jij verliest 1 leger'],
    [2, 0, 'Jij verliest 2 legers'],
    [1, 1, 'Jullie verliezen allebei 1 leger'],
  ])('schrijft uitkomst %i-om-%i verhalend uit', (attackerLosses, defenderLosses, expected) => {
    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territories}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={null}
        combat={{
          correlationId: 'c1',
          attackerRolls: [5, 3],
          defenderRolls: [4],
          reroll: null,
          narrated: {
            correlationId: 'c1',
            attackerId: 'alice',
            defenderId: 'bob',
            fromTerritoryId: 'alaska',
            toTerritoryId: 'kamchatka',
            attackerLosses,
            defenderLosses,
            conquered: false,
            eliminatedPlayerId: null,
            stateVersion: 3,
          },
        }}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={vi.fn()}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('roept onAbandonAttack aan zodra de aanvaller op "Ander gevecht" klikt, zodat de beurttimer meteen hervat (FO §5.4)', async () => {
    const user = userEvent.setup()
    const onAbandonAttack = vi.fn().mockResolvedValue(undefined)

    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territories}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={null}
        combat={{
          correlationId: 'c1',
          attackerRolls: [5, 3],
          defenderRolls: [4],
          reroll: null,
          narrated: {
            correlationId: 'c1',
            attackerId: 'alice',
            defenderId: 'bob',
            fromTerritoryId: 'alaska',
            toTerritoryId: 'kamchatka',
            attackerLosses: 1,
            defenderLosses: 0,
            conquered: false,
            eliminatedPlayerId: null,
            stateVersion: 3,
          },
        }}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={onAbandonAttack}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    await user.click(screen.getByText('Ander gevecht'))

    expect(onAbandonAttack).toHaveBeenCalled()
    // Na het afbreken gaat de lokale substaat terug naar de bronkeuze.
    expect(screen.getByText('Kies een van je gebieden dat kan aanvallen.')).toBeInTheDocument()
  })

  it('start op de bronkeuze i.p.v. het "nog een keer aanvallen"-scherm bij een verse mount na een veroverd gevecht', () => {
    // Simuleert de remount die volgt op ConquestMoveStep → confirm: pendingCombat is dan al
    // null, maar `combat.narrated` van de zojuist afgehandelde (veroverde) aanval staat nog.
    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territories.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territories}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={null}
        combat={{
          correlationId: 'c1',
          attackerRolls: [6, 3],
          defenderRolls: [1],
          reroll: null,
          narrated: {
            correlationId: 'c1',
            attackerId: 'alice',
            defenderId: 'bob',
            fromTerritoryId: 'alaska',
            toTerritoryId: 'kamchatka',
            attackerLosses: 0,
            defenderLosses: 1,
            conquered: true,
            eliminatedPlayerId: null,
            stateVersion: 4,
          },
        }}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={vi.fn()}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.getByText('Kies een van je gebieden dat kan aanvallen.')).toBeInTheDocument()
    expect(screen.queryByText('Nog een keer aanvallen')).not.toBeInTheDocument()
  })

  it('verbergt "Nog een keer aanvallen" als het brongebied door verliezen nog maar 1 leger over heeft', () => {
    const territoriesAfterLosses = territories.map((t) => (t.territoryId === 'alaska' ? { ...t, armyCount: 1 } : t))

    render(
      <AttackFlowStep
        playerId="alice"
        myTerritories={territoriesAfterLosses.filter((t) => t.ownerPlayerId === 'alice')}
        territories={territoriesAfterLosses}
        territoryCatalog={territoryCatalog}
        players={players}
        colors={colors}
        myColor={myColor}
        pendingCombat={null}
        combat={{
          correlationId: 'c1',
          attackerRolls: [2, 1],
          defenderRolls: [4],
          reroll: null,
          narrated: {
            correlationId: 'c1',
            attackerId: 'alice',
            defenderId: 'bob',
            fromTerritoryId: 'alaska',
            toTerritoryId: 'kamchatka',
            attackerLosses: 3,
            defenderLosses: 0,
            conquered: false,
            eliminatedPlayerId: null,
            stateVersion: 3,
          },
        }}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={vi.fn()}
        onRerollAttackDie={vi.fn()}
        onKeepAttackDice={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.queryByText('Nog een keer aanvallen')).not.toBeInTheDocument()
    // De overige vervolgacties blijven wel beschikbaar.
    expect(screen.getByText('Ander gevecht')).toBeInTheDocument()
  })
})
