namespace RiskGame.Persistence.Events;

/// <summary>
/// De order-roll is afgerond: <paramref name="PlayerIds"/> is de definitieve
/// spelersvolgorde (FO §5.1, hoogste totaal eerst; gelijkspel al opgelost via herworpen
/// <see cref="OrderRolled"/>-events vóór dit event ontstaat).
/// </summary>
public sealed record TurnOrderDetermined(string GameId, IReadOnlyList<string> PlayerIds);
