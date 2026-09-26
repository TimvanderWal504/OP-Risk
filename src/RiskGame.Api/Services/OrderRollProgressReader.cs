using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Api.Services;

/// <summary>
/// Leest de order-roll-voortgang (FO §2.1) uit de ruwe event-stream. <c>OrderRolled</c> heeft
/// bewust geen vouwregel, dus <see cref="GameState"/> weet niet wie er al gooide en kan
/// <see cref="GameStateDtoMapper"/> <see cref="GameStateDto.OrderRollState"/> niet invullen.
/// Elk pad dat tijdens de order-roll een state levert, haalt het hier op — anders krijgt de
/// telefoon een lege "nog te gooien"-lijst en verdwijnt de Gooien-knop voor iedereen.
/// </summary>
public static class OrderRollProgressReader
{
    public static async Task<IReadOnlyList<OrderRollThrow>> ReadThrowsAsync(IQuerySession session, string gameId)
    {
        var rawEvents = await session.Events.FetchStreamAsync(gameId);

        return rawEvents
            .Select(rawEvent => rawEvent.Data)
            .OfType<OrderRolled>()
            .Select(orderRolled => new OrderRollThrow(orderRolled.PlayerId, orderRolled.Die1, orderRolled.Die2))
            .ToArray();
    }

    /// <summary>Buiten de order-roll-fase <c>null</c>, net als voorheen in de mapper.</summary>
    public static async Task<OrderRollStateDto?> ReadStateAsync(IQuerySession session, GameState state)
    {
        if (state.Phase != GamePhase.OrderRoll)
        {
            return null;
        }

        var allPlayerIds = state.Players.Select(player => player.Id).ToArray();
        var progress = OrderRollCalculator.Evaluate(allPlayerIds, await ReadThrowsAsync(session, state.GameId));

        return new OrderRollStateDto(progress.StillToRoll);
    }
}
