using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>ClaimTerritory</c> en <c>PlaceInitialArmy</c>
/// (FO §5.1). Geen dobbelen nodig, dus geen <see cref="RiskGame.Rules.Abstractions.IRandomSource"/>
/// — alleen guards, event(s) appenden en de nieuwe projectie teruggeven.
/// </summary>
public sealed class SetupCommandHandler(IDocumentStore store, TimeProvider timeProvider)
{
    public async Task<Result<GameStateDto>> ClaimTerritoryAsync(string gameId, string playerId, string territoryId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
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

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }

    public async Task<Result<GameStateDto>> PlaceInitialArmyAsync(string gameId, string playerId, string territoryId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        // StartingArmiesResolver vereist een definitief spelersaantal (2–7): pas veilig zodra
        // de fase-guard bevestigt dat het spel echt in InitialPlacement is. Een client die dit
        // commando te vroeg aanroept (bv. nog in Lobby, 1 speler) krijgt zo een nette
        // validatiefout in plaats van een crash op de preset-opzoeking.
        var phaseCheck = SetupGuards.GameIsInInitialPlacement(state);

        if (!phaseCheck.IsSuccess)
        {
            return Result<GameStateDto>.Failure(phaseCheck.Errors);
        }

        var startingArmies = StartingArmiesResolver.Resolve(state);

        var validation = ValidationResult.Combine(
            Guards.PlayerExists(state, playerId),
            SetupGuards.IsPlayersTurnToPlace(state, playerId, startingArmies),
            Guards.OwnsTerritory(state, playerId, territoryId));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new InitialArmyPlaced(gameId, playerId, territoryId));

        var totalArmiesPlaced = state.Territories.Sum(territory => territory.ArmyCount) + 1;
        var totalArmiesExpected = startingArmies * state.Players.Count;

        if (totalArmiesPlaced == totalArmiesExpected)
        {
            var now = timeProvider.GetUtcNow();
            var timer = PhaseTimerFactory.ForPhase(TurnPhase.Reinforce, state.Settings, currentTimer: null, now);

            // De eerste beurt is van de eerste speler in de volgorde — niet van wie toevallig
            // het laatste startleger plaatste (bij SetupMode.Random kan dat iedereen zijn).
            // Zijn versterkingen horen dus ook voor hém berekend te worden.
            var firstPlayerId = state.TurnOrder[0];

            session.Events.Append(
                gameId,
                new PhaseChanged(
                    gameId,
                    firstPlayerId,
                    TurnPhase.Reinforce,
                    timer.Remaining,
                    now,
                    ReinforcementCalculator.CalculateArmies(state, firstPlayerId)));
        }

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }
}
