using Marten;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.AutoPass;
using RiskGame.Rules.Combat;
using RiskGame.Rules.Missions;
using RiskGame.Rules.State;

namespace RiskGame.Api.Commands;

/// <summary>De uitkomst van één verdedigingsworp (FO §5.3 stap 4–6), voor de narratieve broadcast.</summary>
public sealed record DefenseResolution(
    IReadOnlyList<int> AttackerRolls,
    IReadOnlyList<int> DefenderRolls,
    int AttackerLosses,
    int DefenderLosses,
    bool Conquered,
    string AttackerId,
    string DefenderId,
    string FromTerritoryId,
    string ToTerritoryId,
    string? EliminatedPlayerId,
    bool DefenseBoostUsed,
    Guid CorrelationId);

/// <summary>Een afgehandelde verdediging en de state zoals de projectie hem daarna ziet.</summary>
public sealed record DefenseOutcome(DefenseResolution Combat, GameState State);

/// <summary>
/// De verdedigingsworp en alles wat eruit volgt (FO §5.3 stap 4–6, §7): gevechtsuitkomst, verovering,
/// uitschakeling, fallback-missies en werelddominantie. Eén plek voor de eigen keuze van de verdediger
/// (<c>ChooseDefenseDice</c>) en de automatische verdediging van een speler op auto-pass (FO §11.2).
/// </summary>
/// <remarks>
/// Appendt alleen; opslaan doet de aanroeper. Vouwt elk event ook in het geheugen
/// (<see cref="ProjectedAppend"/>), zodat de aanroeper na het gevecht verder kan rekenen — bijvoorbeeld
/// om een afgebroken beurt van een aanvaller op auto-pass af te maken.
/// </remarks>
public sealed class DefenseStep(IRandomSource random, TimeProvider timeProvider, GameProjection projection)
{
    /// <summary>
    /// Verdedigt voor <paramref name="defenderId"/> met <paramref name="defenseDice"/> stenen. De keuze is
    /// al gevalideerd: door <see cref="AttackGuards.CanChooseDefenseDice"/>, of bij auto-pass door
    /// <see cref="AutoPassPlanner.DefenseDice"/>, die op dezelfde guard leunt.
    /// </summary>
    public DefenseOutcome Resolve(IDocumentSession session, GameState state, string defenderId, int defenseDice)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(defenderId);

        var gameId = state.GameId;
        var defenseBoostUsed = AttackGuards.DefenseBoostRequired(state, defenseDice);

        if (defenseBoostUsed)
        {
            state = ProjectedAppend.Emit(session, state, new DefenseBoostUsed(gameId, defenderId), projection.Apply);
        }

        var pendingCombat = state.TurnState!.PendingCombat!;
        var attackerId = state.TurnState.ActivePlayerId;
        // C5/C6: PendingCombat.AttackerRolls is leidend, niet de DiceRolled-audittrail — na een
        // herwerp staat daar nog de oorspronkelijke worp, PendingCombat is al bijgewerkt.
        var attackerRolls = pendingCombat.AttackerRolls;

        var defenderRolls = CombatResolver.RollDice(defenseDice, random);
        // DiceRolled is een audit-/TV-feit zonder vouwregel.
        session.Events.Append(gameId, new DiceRolled(gameId, defenderId, defenderRolls));

        var outcome = CombatResolver.Compare(attackerRolls, defenderRolls);

        var fromArmyCount = state.Territory(pendingCombat.FromTerritoryId).ArmyCount;
        var toArmyCount = state.Territory(pendingCombat.ToTerritoryId).ArmyCount;
        var conquest = ConquestResolution.Apply(fromArmyCount, toArmyCount, outcome);
        var defenderTerritoryCount = state.TerritoriesOf(defenderId).Count();

        // De timer hervat hier alleen als het gevecht meteen klaar is (geen verovering); bij
        // een verovering blijft hij gepauzeerd tot ArmiesMovedAfterConquest (FO §5.4).
        var resumedAtUtc = conquest.Conquered ? (DateTimeOffset?)null : timeProvider.GetUtcNow();

        state = ProjectedAppend.Emit(
            session,
            state,
            new CombatResolved(
                gameId,
                attackerId,
                pendingCombat.FromTerritoryId,
                pendingCombat.ToTerritoryId,
                attackerRolls,
                defenderRolls,
                outcome.AttackerLosses,
                outcome.DefenderLosses,
                resumedAtUtc),
            projection.Apply);

        string? eliminatedPlayerId = null;

        if (conquest.Conquered)
        {
            state = ProjectedAppend.Emit(
                session, state, new TerritoryConquered(gameId, attackerId, pendingCombat.ToTerritoryId), projection.Apply);

            if (defenderTerritoryCount == 1)
            {
                // De rest (fallback-missies, werelddominantie) rekent op de spelers van vóór de
                // uitschakeling, zoals altijd: de uitgeschakelde draagt zijn kleur nog.
                var beforeElimination = state;

                state = ProjectedAppend.Emit(
                    session, state, new PlayerEliminated(gameId, defenderId, attackerId), projection.Apply);
                eliminatedPlayerId = defenderId;

                // FO §6.1: schakelt een ándere speler dan de missiehouder het doelwit van
                // diens EliminatePlayer-missie uit, dan vervalt die missie en komt de
                // missiehouder automatisch op de fallback-missie uit.
                var eliminatedColorId = beforeElimination.Player(defenderId).ColorId!;
                var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
                    beforeElimination.Players, state.Map.Missions, eliminatedColorId, attackerId, random);

                foreach (var (holderId, fallbackMissionId) in fallbacks)
                {
                    state = ProjectedAppend.Emit(
                        session, state, new MissionAssigned(gameId, holderId, fallbackMissionId), projection.Apply);
                }

                // Werelddominantie kan alleen ontstaan door de laatste tegenstander uit te schakelen.
                if (WinConditionEvaluator.HasWorldDomination(state, attackerId))
                {
                    state = ProjectedAppend.Emit(session, state, new GameWon(gameId, [attackerId]), projection.Apply);
                }
            }
        }

        var combat = new DefenseResolution(
            attackerRolls,
            defenderRolls,
            outcome.AttackerLosses,
            outcome.DefenderLosses,
            conquest.Conquered,
            attackerId,
            defenderId,
            pendingCombat.FromTerritoryId,
            pendingCombat.ToTerritoryId,
            eliminatedPlayerId,
            defenseBoostUsed,
            pendingCombat.CorrelationId);

        return new DefenseOutcome(combat, state);
    }

    /// <summary>
    /// Verdedigt meteen voor een verdediger op auto-pass (FO §11.2), zodra het gevecht bij hem ligt: er
    /// loopt een gevecht, de aanvaller heeft geen herwerp-keuze meer open en het doelgebied is nog van de
    /// verdediger (geen verovering die op de meeverplaatsing wacht). Anders <c>null</c>.
    /// </summary>
    public DefenseOutcome? DefendIfAutoPass(IDocumentSession session, GameState state)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);

        if (state.TurnState?.PendingCombat is not { AwaitingRerollDecision: false } pendingCombat)
        {
            return null;
        }

        var defenderId = state.Territory(pendingCombat.ToTerritoryId).OwnerPlayerId!;

        if (defenderId == state.TurnState.ActivePlayerId || !state.Player(defenderId).IsAutoPass)
        {
            return null;
        }

        return Resolve(session, state, defenderId, AutoPassPlanner.DefenseDice(state, defenderId));
    }
}
