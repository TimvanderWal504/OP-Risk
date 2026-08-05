import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AttackFlowStep } from './AttackFlowStep'

const players = [
  { id: 'alice', name: 'Alice', colorId: 'red', roleId: null, isHost: true, isEliminated: false },
  { id: 'bob', name: 'Bob', colorId: 'blue', roleId: null, isHost: false, isEliminated: false },
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
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.getByText('Alaska')).toBeInTheDocument()
    expect(screen.queryByText('Brazilië')).not.toBeInTheDocument()
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
        pendingCombat={{ fromTerritoryId: 'alaska', toTerritoryId: 'kamchatka', attackDice: 2 }}
        combat={{ correlationId: 'c1', attackerRolls: [5, 3], defenderRolls: null, narrated: null }}
        onDeclareAttack={vi.fn()}
        onAbandonAttack={vi.fn()}
        onEndPhase={vi.fn()}
      />,
    )

    // "Aanvallen vanuit" komt ook voor als staplabel in de stap-indicator (altijd zichtbaar,
    // ongeacht fase) — de subtitel van de bron-picker is wél uniek voor die stap.
    expect(screen.queryByText('Kies een van je gebieden dat kan aanvallen.')).not.toBeInTheDocument()
    expect(screen.getByText('Uitkomst')).toBeInTheDocument()
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
        onEndPhase={onEndPhase}
      />,
    )

    expect(screen.getByText('Jij −1 · verdediger −0')).toBeInTheDocument()

    await user.click(screen.getByText('Naar Verplaatsen', { exact: false }))
    expect(onEndPhase).toHaveBeenCalled()
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
        onEndPhase={vi.fn()}
      />,
    )

    expect(screen.queryByText('Nog een keer aanvallen')).not.toBeInTheDocument()
    // De overige vervolgacties blijven wel beschikbaar.
    expect(screen.getByText('Ander gevecht')).toBeInTheDocument()
  })
})
