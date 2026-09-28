namespace RiskGame.Persistence.Events;

/// <summary>
/// De beurt van de tot dan toe actieve speler is voorbij (FO §5.2/§5.5, commando
/// <c>EndTurn</c> uit TO §4.1). De overgang naar de volgende speler wordt uitgedrukt door het
/// <see cref="PhaseChanged"/>-event (<see cref="Rules.State.TurnPhase.Reinforce"/>) dat erop
/// volgt; de vouwregel van dit event zet alleen een geïnde gebeurtenisbonus
/// (<see cref="Rules.State.Player.PendingEventBonus"/>, FO §9.2) van deze speler op 0.
/// </summary>
public sealed record TurnEnded(string GameId, string PlayerId);
