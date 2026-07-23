using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>ClaimTerritory</c> en <c>PlaceInitialArmy</c>
/// (FO §5.1). Geen dobbelen nodig, dus geen <see cref="RiskGame.Rules.Abstractions.IRandomSource"/>
/// — alleen guards, event(s) appenden en de nieuwe projectie teruggeven.
/// </summary>
public sealed class SetupCommandHandler(IDocumentStore store)
{
    public async Task<Result<GameStateDto>> ClaimTerritoryAsync(string gameId, string playerId, string territoryId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = ValidationResult.Combine(
            SetupGuards.GameIsInClaiming(state),
            Guards.PlayerExists(state, playerId),
            SetupGuards.IsPlayersTurnToClaim(state, playerId),
            SetupGuards.TerritoryIsFree(state, territoryId),
            SetupGuards.TerritoryIsNotOwnRoleOrigin(state, playerId, territoryId));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new TerritoryClaimed(gameId, playerId, territoryId));

        var claimedCount = state.Territories.Count(territory => territory.OwnerPlayerId is not null) + 1;

        if (claimedCount == state.Map.Territories.Count)
        {
            session.Events.Append(gameId, new ClaimingCompleted(gameId));
        }

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }

    public async Task<Result<GameStateDto>> PlaceInitialArmyAsync(string gameId, string playerId, string territoryId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = ValidationResult.Combine(
            SetupGuards.GameIsInInitialPlacement(state),
            Guards.PlayerExists(state, playerId),
            SetupGuards.IsPlayersTurnToPlace(state, playerId),
            Guards.OwnsTerritory(state, playerId, territoryId));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new InitialArmyPlaced(gameId, playerId, territoryId));

        var totalArmiesPlaced = state.Territories.Sum(territory => territory.ArmyCount) + 1;
        var totalArmiesExpected = state.Settings.StartingArmies * state.Players.Count;

        if (totalArmiesPlaced == totalArmiesExpected)
        {
            session.Events.Append(gameId, new PhaseChanged(gameId, state.TurnOrder[0], TurnPhase.Reinforce));
        }

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }
}
