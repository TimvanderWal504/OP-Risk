namespace RiskGame.Persistence.Events;

/// <summary>Een speler is de lobby binnengekomen, nog zonder kleur (FO §2.2).</summary>
public sealed record PlayerJoined(string GameId, string PlayerId, string Name);
