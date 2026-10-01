using Marten;
using RiskGame.Rules.State;

namespace RiskGame.Api.Commands;

/// <summary>
/// Appendt een event en vouwt het meteen in het geheugen met dezelfde vouwregel als Marten's
/// inline projectie. Voor handlers die na een event al op de nieuwe state verder rekenen binnen
/// dezelfde, nog niet opgeslagen batch (gebeurtenisronde, automatische beurt).
/// </summary>
internal static class ProjectedAppend
{
    public static GameState Emit<TEvent>(
        IDocumentSession session, GameState state, TEvent @event, Func<GameState, TEvent, GameState> fold)
        where TEvent : notnull
    {
        session.Events.Append(state.GameId, @event);

        return fold(state, @event);
    }
}
