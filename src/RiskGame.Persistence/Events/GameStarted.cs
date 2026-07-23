namespace RiskGame.Persistence.Events;

/// <summary>De host heeft het spel gestart (FO §2.1); de lobby sluit en de order-roll begint.</summary>
public sealed record GameStarted(string GameId);
