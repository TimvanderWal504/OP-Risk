namespace RiskGame.Persistence.Events;

/// <summary>
/// De beurt van de tot dan toe actieve speler is voorbij (FO §5.2/§5.5, commando
/// <c>EndTurn</c> uit TO §4.1). Puur audit/weergave-feit, net als <see cref="OrderRolled"/>:
/// de daadwerkelijke overgang naar de volgende speler wordt uitgedrukt door het
/// <see cref="PhaseChanged"/>-event (<see cref="Rules.State.TurnPhase.Reinforce"/>) dat
/// erop volgt, dus dit event heeft bewust geen eigen vouwregel in
/// <see cref="Projections.GameProjection"/>.
/// </summary>
public sealed record TurnEnded(string GameId, string PlayerId);
