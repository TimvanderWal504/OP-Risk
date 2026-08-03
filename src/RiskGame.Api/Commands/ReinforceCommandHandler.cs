using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>PlaceReinforcements</c> en <c>TradeInCards</c>
/// (FO §5.2). Geen dobbelen nodig, dus geen <see cref="RiskGame.Rules.Abstractions.IRandomSource"/>
/// — alleen guards, event(s) appenden en de nieuwe projectie teruggeven.
/// </summary>
public sealed class ReinforceCommandHandler(IDocumentStore store, TimeProvider timeProvider)
{
    public async Task<Result<GameStateDto>> PlaceReinforcementsAsync(
        string gameId, string playerId, string territoryId, int amount)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = ValidationResult.Combine(
            Guards.PlayerExists(state, playerId),
            ReinforceGuards.CanPlaceArmies(state, playerId, territoryId, amount));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        if (amount > state.TurnState!.ArmiesRemaining)
        {
            return Result<GameStateDto>.Failure(
                "reinforce.notEnoughArmiesRemaining",
                new Dictionary<string, string>
                {
                    ["playerId"] = playerId,
                    ["remaining"] = state.TurnState.ArmiesRemaining.ToString(),
                    ["requested"] = amount.ToString(),
                });
        }

        session.Events.Append(gameId, new ArmiesReinforced(gameId, playerId, territoryId, amount));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }

    public async Task<Result<GameStateDto>> TradeInCardsAsync(
        string gameId, string playerId, IReadOnlyList<string> cardIds)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = ValidationResult.Combine(
            Guards.PlayerExists(state, playerId),
            ReinforceGuards.CanTradeInCards(state, playerId, cardIds));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        // De opbrengst hoort bij het feit, niet bij het vouwen ervan (src/CLAUDE.md, event
        // sourcing): berekenen op de state zoals die nú is, en het resultaat het event in.
        var tradedCards = cardIds
            .Select(cardId => state.Player(playerId).Hand.First(card => card.Id == cardId))
            .ToArray();
        var outcome = CardTradeCalculator.Evaluate(state, playerId, tradedCards);

        session.Events.Append(
            gameId,
            new CardsTraded(
                gameId,
                playerId,
                cardIds,
                outcome.SetValue,
                outcome.OwnedTerritoryBonuses,
                CardTradeCalculator.NextTradeValueAfter(state.Deck.NextTradeValue)));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }
}
