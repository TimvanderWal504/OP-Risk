using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Fortify;

/// <summary>
/// Regelvalidatie voor de verplaatsingsfase (FO §5.2): mag deze <c>Fortify</c> op deze
/// state, ja of nee. Puur validatie, geen state-mutatie — het daadwerkelijk verplaatsen
/// van legers hoort bij de command-orchestratie in een latere bouwstap (TO §11, stap 3),
/// net als bij <see cref="Combat.AttackGuards"/> en <see cref="Reinforcement.ReinforceGuards"/>.
/// </summary>
public static class FortifyGuards
{
    public static ValidationResult CanFortify(
        GameState state,
        string playerId,
        string fromTerritoryId,
        string toTerritoryId,
        int armiesToMove)
    {
        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Fortify),
            Guards.OwnsTerritory(state, playerId, fromTerritoryId),
            Guards.OwnsTerritory(state, playerId, toTerritoryId));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        if (fromTerritoryId == toTerritoryId)
        {
            return ValidationResult.Failure("Bron- en doelgebied moeten verschillend zijn.");
        }

        var fromArmyCount = state.Territory(fromTerritoryId).ArmyCount;

        var checks = new List<ValidationResult>
        {
            armiesToMove >= 1
                ? ValidationResult.Success()
                : ValidationResult.Failure("Er moet minimaal 1 leger verplaatst worden."),

            armiesToMove <= fromArmyCount - 1
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    $"Er moet minimaal 1 leger achterblijven in '{fromTerritoryId}' " +
                    $"({fromArmyCount} beschikbaar, {armiesToMove} opgegeven)."),

            HasFortifyPath(state, playerId, fromTerritoryId, toTerritoryId)
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    $"Er is geen aaneengesloten pad van eigen gebieden tussen " +
                    $"'{fromTerritoryId}' en '{toTerritoryId}'."),
        };

        return ValidationResult.Combine([.. checks]);
    }

    private static bool HasFortifyPath(
        GameState state, string playerId, string fromTerritoryId, string toTerritoryId) =>
        state.Map.Adjacency.HasPath(
            fromTerritoryId,
            toTerritoryId,
            territoryId => state.Territory(territoryId).OwnerPlayerId == playerId,
            BuildBlockedBorderPredicate(state));

    private static Func<Border, bool>? BuildBlockedBorderPredicate(GameState state)
    {
        var blockers = state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<ISeaRouteBlockingEffect>()
            .ToArray();

        return blockers.Length == 0
            ? null
            : border => blockers.Any(blocker => blocker.IsRouteBlocked(border));
    }
}
