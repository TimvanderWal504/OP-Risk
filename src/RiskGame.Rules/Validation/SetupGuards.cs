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
    /// De keerzijde van <see cref="TerritoryIsFree"/> en <see cref="TerritoryIsNotOwnRoleOrigin"/>:
    /// welke gebieden hálen die controles voor deze speler. Bewust via de guards zelf en niet
    /// met een eigen kopie van hun voorwaarden, zodat de aangeboden keuzes per constructie niet
    /// kunnen afwijken van wat het commando accepteert. De client toont hiermee alleen wat mag,
    /// in plaats van zelf te bepalen wat mag (frontend/CLAUDE.md, server-authoritative).
    /// </summary>
    public static IReadOnlyList<string> ClaimableTerritoryIdsFor(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);

        return
        [
            .. state.Territories
                .Select(territory => territory.TerritoryId)
                .Where(territoryId =>
                    TerritoryIsFree(state, territoryId).IsSuccess
                    && TerritoryIsNotOwnRoleOrigin(state, playerId, territoryId).IsSuccess),
        ];
    }

    /// <summary>
    /// FO §5.1: bij <see cref="SetupMode.Claiming"/> blijft bijplaatsen turn-based (faalt ook
    /// als het al klaar is — <see cref="SetupTurnCalculator.ActivePlacerId"/> is dan
    /// <c>null</c>, dus geen enkele speler is nog "aan de beurt"). Bij
    /// <see cref="SetupMode.Random"/> is er geen beurt: elke speler mag plaatsen zolang hij
    /// zelf nog restbudget heeft (<see cref="SetupTurnCalculator.RemainingArmiesFor"/>).
    /// </summary>
    public static ValidationResult IsPlayersTurnToPlace(GameState state, string playerId)
    {
        var exists = Guards.PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        if (state.Settings.SetupMode == SetupMode.Random)
        {
            return SetupTurnCalculator.RemainingArmiesFor(state, playerId) > 0
                ? ValidationResult.Success()
                : ValidationResult.Failure("setup.noArmiesLeftToPlace", new Dictionary<string, string> { ["playerId"] = playerId });
        }

        return playerId == SetupTurnCalculator.ActivePlacerId(state)
            ? ValidationResult.Success()
            : ValidationResult.Failure("setup.notYourTurnToPlace", new Dictionary<string, string> { ["playerId"] = playerId });
    }
}
