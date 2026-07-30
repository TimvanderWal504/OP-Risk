using RiskGame.Rules.Roles;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Validation;

/// <summary>
/// De controles die specifiek bij <c>ClaimTerritory</c> en <c>PlaceInitialArmy</c> horen
/// (FO §5.1, TO §4.1).
/// </summary>
public static class SetupGuards
{
    public static ValidationResult GameIsInClaiming(GameState state) =>
        Guards.IsInPhase(state, GamePhase.Claiming);

    public static ValidationResult GameIsInInitialPlacement(GameState state) =>
        Guards.IsInPhase(state, GamePhase.InitialPlacement);

    public static ValidationResult IsPlayersTurnToClaim(GameState state, string playerId)
    {
        var exists = Guards.PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return playerId == SetupTurnCalculator.ActiveClaimerId(state)
            ? ValidationResult.Success()
            : ValidationResult.Failure("setup.notYourTurnToClaim", new Dictionary<string, string> { ["playerId"] = playerId });
    }

    public static ValidationResult TerritoryIsFree(GameState state, string territoryId)
    {
        var exists = Guards.TerritoryExists(state, territoryId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return state.Territory(territoryId).OwnerPlayerId is null
            ? ValidationResult.Success()
            : ValidationResult.Failure("setup.territoryAlreadyClaimed", new Dictionary<string, string> { ["territoryId"] = territoryId });
    }

    /// <summary>
    /// FO §8.1: bij claim-modus mag een speler zijn eigen rol-herkomstland niet claimen
    /// tijdens de setup (veroveren mag later uiteraard wel). Geen enkele beperking als de
    /// speler geen rol heeft.
    /// </summary>
    public static ValidationResult TerritoryIsNotOwnRoleOrigin(
        GameState state, string playerId, string territoryId)
    {
        var exists = Guards.PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        var originTerritoryId = RoleOriginLookup.OriginTerritoryIdOf(state.Player(playerId).RoleId, state.Map.Roles);

        return originTerritoryId == territoryId
            ? ValidationResult.Failure(
                "setup.cannotClaimOwnRoleOrigin",
                new Dictionary<string, string> { ["playerId"] = playerId, ["territoryId"] = territoryId })
            : ValidationResult.Success();
    }

    /// <summary>
    /// Faalt ook als het bijplaatsen al klaar is (<see cref="SetupTurnCalculator.ActivePlacerId"/>
    /// is dan <c>null</c>, dus geen enkele speler is nog "aan de beurt").
    /// </summary>
    public static ValidationResult IsPlayersTurnToPlace(GameState state, string playerId)
    {
        var exists = Guards.PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return playerId == SetupTurnCalculator.ActivePlacerId(state)
            ? ValidationResult.Success()
            : ValidationResult.Failure("setup.notYourTurnToPlace", new Dictionary<string, string> { ["playerId"] = playerId });
    }
}
