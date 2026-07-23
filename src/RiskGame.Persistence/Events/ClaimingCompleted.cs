namespace RiskGame.Persistence.Events;

/// <summary>Het laatste vrije gebied is geclaimd (FO §5.1); Claiming maakt plaats voor InitialPlacement.</summary>
public sealed record ClaimingCompleted(string GameId);
