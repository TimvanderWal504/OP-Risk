namespace RiskGame.Persistence.Events;

/// <summary>
/// De speler is terug (FO §11.2): zijn telefoon verbond opnieuw met zijn eigen sessie
/// (<c>RejoinGame</c>). Zet <see cref="Rules.State.Player.IsAutoPass"/> terug; wat de server intussen
/// voor hem deed, blijft staan.
/// </summary>
public sealed record AutoPassDisabled(string GameId, string PlayerId);
