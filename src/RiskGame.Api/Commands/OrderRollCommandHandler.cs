using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

public sealed record OrderRollResult(int Die1, int Die2, GameStateDto State);

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>RollForOrder</c> (FO §2.1). Omdat
/// <c>OrderRolled</c>-events bewust geen vouwregel hebben (zie de doc-comment op dat
/// event), leest deze handler de ruwe stream terug om te bepalen wie er nu nog mag/moet
/// gooien — <see cref="OrderRollCalculator"/> repliceert de rondes daaruit.
/// </summary>
public sealed class OrderRollCommandHandler(IDocumentStore store, IRandomSource random)
{
    public async Task<Result<OrderRollResult>> RollForOrderAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<OrderRollResult>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = ValidationResult.Combine(
            OrderRollGuards.GameIsInOrderRoll(state),
            Guards.PlayerExists(state, playerId));

        if (!validation.IsSuccess)
        {
            return Result<OrderRollResult>.Failure(validation.Errors);
        }

        var allPlayerIds = state.Players.Select(player => player.Id).ToArray();
        var rawEvents = await session.Events.FetchStreamAsync(gameId);
        var throwsSoFar = rawEvents
            .Select(rawEvent => rawEvent.Data)
            .OfType<OrderRolled>()
            .Select(orderRolled => new OrderRollThrow(orderRolled.PlayerId, orderRolled.Die1, orderRolled.Die2))
            .ToArray();

        var progress = OrderRollCalculator.Evaluate(allPlayerIds, throwsSoFar);
        var canRoll = OrderRollGuards.PlayerMayRoll(state, playerId, progress);

        if (!canRoll.IsSuccess)
        {
            return Result<OrderRollResult>.Failure(canRoll.Errors);
        }

        var (die1, die2) = OrderRollCalculator.RollTwoDice(random);
        session.Events.Append(gameId, new OrderRolled(gameId, playerId, die1, die2));

        var updatedThrows = throwsSoFar.Append(new OrderRollThrow(playerId, die1, die2)).ToArray();
        var updatedProgress = OrderRollCalculator.Evaluate(allPlayerIds, updatedThrows);

        if (updatedProgress.Winner is not null)
        {
            var turnOrder = new[] { updatedProgress.Winner }
                .Concat(allPlayerIds.Where(id => id != updatedProgress.Winner))
                .ToArray();
            session.Events.Append(gameId, new TurnOrderDetermined(gameId, turnOrder));
        }

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<OrderRollResult>.Success(
            new OrderRollResult(die1, die2, GameStateDtoMapper.ToDto(updated!)));
    }
}
