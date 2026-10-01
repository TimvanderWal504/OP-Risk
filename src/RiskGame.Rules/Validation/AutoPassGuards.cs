using RiskGame.Rules.State;

namespace RiskGame.Rules.Validation;

/// <summary>
/// Of de host een speler op auto-pass mag zetten (FO §11.2, TO §4.1 <c>SetAutoPass</c>). Of de
/// aanroepende verbinding echt bij de host hoort, is transportinformatie en wordt in de API-laag
/// gecontroleerd — hier alleen de spelregels.
/// </summary>
public static class AutoPassGuards
{
    public static ValidationResult CanSetAutoPass(GameState state, string hostPlayerId, string targetPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        var preconditions = ValidationResult.Combine(
            Guards.IsInPhase(state, GamePhase.InProgress),
            LobbyGuards.CallerIsHost(state, hostPlayerId),
            Guards.IsNotEliminated(state, targetPlayerId));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        if (targetPlayerId == hostPlayerId)
        {
            return ValidationResult.Failure("autoPass.cannotTargetHost");
        }

        if (state.Player(targetPlayerId).IsAutoPass)
        {
            return ValidationResult.Failure(
                "autoPass.alreadyAutoPass", new Dictionary<string, string> { ["playerId"] = targetPlayerId });
        }

        return LeavesPlayerWithoutAutoPass(state, targetPlayerId)
            ? ValidationResult.Success()
            : ValidationResult.Failure("autoPass.noPlayerLeft");
    }

    /// <summary>
    /// Of er na het op auto-pass zetten van <paramref name="playerId"/> nog minstens één speler
    /// overblijft die niet uitgeschakeld is en niet op auto-pass staat (FO §11.1/§11.2). Zonder
    /// zo'n speler zou de server alleen nog automatische beurten spelen. Gedeeld met de
    /// host-uitval, die dezelfde grens kent.
    /// </summary>
    public static bool LeavesPlayerWithoutAutoPass(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        return state.Players.Any(player => player.Id != playerId && !player.IsEliminated && !player.IsAutoPass);
    }
}
