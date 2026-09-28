using Marten;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Api.Commands;

/// <summary>
/// Laat een beurt beginnen (FO §5.2, §5.4): een <see cref="PhaseChanged"/> naar Versterken met
/// een verse beurttimer en de toegekende versterkingen. Eén plek voor elk pad dat een beurt
/// start — de eerste beurt na de startopstelling en de volgende beurt na <c>EndTurn</c> — zodat
/// timer en versterkingsberekening nooit per pad uiteenlopen.
/// </summary>
public static class TurnStarter
{
    /// <summary>
    /// Appendt de start van de beurt van <paramref name="playerId"/>. De versterkingen worden
    /// berekend op <paramref name="state"/>: de aanroeper geeft dus de state zoals de projectie
    /// hem ziet op het moment dat deze beurt begint — niet een oudere.
    /// </summary>
    public static void StartTurn(IDocumentSession session, GameState state, string playerId, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        var timer = PhaseTimerFactory.ForPhase(TurnPhase.Reinforce, state.Settings, currentTimer: null, now);

        session.Events.Append(
            state.GameId,
            new PhaseChanged(
                state.GameId,
                playerId,
                TurnPhase.Reinforce,
                timer.Remaining,
                now,
                ReinforcementCalculator.CalculateArmies(state, playerId)));
    }
}
