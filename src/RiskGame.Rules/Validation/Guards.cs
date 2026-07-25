using RiskGame.Rules.State;

namespace RiskGame.Rules.Validation;

/// <summary>
/// De controles die in vrijwel elk commando terugkomen, op één plek. Gekopieerde
/// "is deze speler aan de beurt"-checks per commandohandler lopen onvermijdelijk uit de
/// pas; dit is de enige plek waar die regels staan.
/// </summary>
public static class Guards
{
    public static ValidationResult PlayerExists(GameState state, string playerId) =>
        state.HasPlayer(playerId)
            ? ValidationResult.Success()
            : ValidationResult.Failure("common.unknownPlayer", new Dictionary<string, string> { ["playerId"] = playerId });

    /// <summary>
    /// Of het deze spelers beurt is. Een uitgeschakelde of afwezige speler is dat nooit,
    /// ook niet als hij nog als actieve speler genoteerd staat — daarom loopt dit via
    /// <see cref="GameState.StatusOf"/> en niet direct langs <c>ActivePlayerId</c>.
    /// </summary>
    public static ValidationResult IsActivePlayer(GameState state, string playerId)
    {
        var exists = PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return state.StatusOf(playerId) == PlayerStatus.Active
            ? ValidationResult.Success()
            : ValidationResult.Failure("common.playerNotActive", new Dictionary<string, string> { ["playerId"] = playerId });
    }

    public static ValidationResult IsNotEliminated(GameState state, string playerId)
    {
        var exists = PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return state.Player(playerId).IsEliminated
            ? ValidationResult.Failure("common.playerEliminated", new Dictionary<string, string> { ["playerId"] = playerId })
            : ValidationResult.Success();
    }

    public static ValidationResult IsInPhase(GameState state, GamePhase phase) =>
        state.Phase == phase
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                "common.wrongPhase",
                new Dictionary<string, string> { ["expected"] = phase.ToString(), ["actual"] = state.Phase.ToString() });

    /// <summary>Of de lopende beurt in de verwachte fase staat. Faalt ook als er geen beurt loopt.</summary>
    public static ValidationResult IsInTurnPhase(GameState state, TurnPhase turnPhase)
    {
        if (state.TurnState is null)
        {
            return ValidationResult.Failure(
                "common.noTurnInProgress",
                new Dictionary<string, string> { ["expected"] = turnPhase.ToString() });
        }

        return state.TurnState.TurnPhase == turnPhase
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                "common.wrongTurnPhase",
                new Dictionary<string, string>
                {
                    ["expected"] = turnPhase.ToString(),
                    ["actual"] = state.TurnState.TurnPhase.ToString(),
                });
    }

    public static ValidationResult TerritoryExists(GameState state, string territoryId) =>
        state.HasTerritory(territoryId)
            ? ValidationResult.Success()
            : ValidationResult.Failure("common.unknownTerritory", new Dictionary<string, string> { ["territoryId"] = territoryId });

    public static ValidationResult OwnsTerritory(
        GameState state, string playerId, string territoryId)
    {
        var exists = TerritoryExists(state, territoryId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return state.Territory(territoryId).OwnerPlayerId == playerId
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                "common.territoryNotOwned",
                new Dictionary<string, string> { ["territoryId"] = territoryId, ["playerId"] = playerId });
    }
}
