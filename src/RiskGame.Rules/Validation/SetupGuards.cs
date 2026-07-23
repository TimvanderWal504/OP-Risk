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
            : ValidationResult.Failure($"Speler '{playerId}' is niet aan de beurt om te claimen.");
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
            : ValidationResult.Failure($"Gebied '{territoryId}' is al geclaimd.");
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

        var roleId = state.Player(playerId).RoleId;

        if (roleId is null)
        {
            return ValidationResult.Success();
        }

        var role = state.Map.Roles.First(role => role.Id == roleId);

        return role.OriginTerritory == territoryId
            ? ValidationResult.Failure(
                $"Speler '{playerId}' mag zijn eigen rol-herkomstland '{territoryId}' niet claimen.")
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
            : ValidationResult.Failure($"Speler '{playerId}' is niet aan de beurt om bij te plaatsen.");
    }
}
