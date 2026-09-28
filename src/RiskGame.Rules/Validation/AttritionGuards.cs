using RiskGame.Rules.Effects;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Validation;

/// <summary>
/// Validatie voor <c>RemoveArmies</c> (FO §9.2, <c>ArmyAttrition</c>): de keuze van een speler
/// buiten de beurtvolgorde om. Geen <see cref="Guards.IsActivePlayer"/>: tijdens attrition loopt
/// er geen beurt, en alle wachtende spelers kiezen tegelijk.
/// </summary>
public static class AttritionGuards
{
    public static ValidationResult CanRemoveArmies(
        GameState state, string playerId, IReadOnlyDictionary<string, int> removalsByTerritory)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentNullException.ThrowIfNull(removalsByTerritory);

        var exists = Guards.PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        if (state.EventRound.PendingAttrition is not { } pending)
        {
            return ValidationResult.Failure("attrition.notPending");
        }

        if (!pending.AwaitingPlayerIds.Contains(playerId))
        {
            return ValidationResult.Failure(
                "attrition.notAwaitingPlayer", new Dictionary<string, string> { ["playerId"] = playerId });
        }

        return ArmyAttritionCalculator.CanApply(state, playerId, removalsByTerritory, pending.Amount);
    }
}
