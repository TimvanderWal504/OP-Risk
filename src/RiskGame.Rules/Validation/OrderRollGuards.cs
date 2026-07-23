using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Validation;

/// <summary>De controles die specifiek bij <c>RollForOrder</c> horen (FO §2.1, TO §4.1).</summary>
public static class OrderRollGuards
{
    public static ValidationResult GameIsInOrderRoll(GameState state) =>
        Guards.IsInPhase(state, GamePhase.OrderRoll);

    /// <summary>
    /// Of <paramref name="playerId"/> nu mag gooien: bestaat, en staat in
    /// <paramref name="progress"/>'s <see cref="OrderRollProgress.StillToRoll"/> — alleen
    /// deelnemers aan de lopende (deel)ronde, dus niet iedereen die ooit nog moet gooien.
    /// </summary>
    public static ValidationResult PlayerMayRoll(GameState state, string playerId, OrderRollProgress progress)
    {
        var exists = Guards.PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return progress.StillToRoll.Contains(playerId)
            ? ValidationResult.Success()
            : ValidationResult.Failure($"Speler '{playerId}' hoeft nu niet te werpen voor de spelersvolgorde.");
    }
}
