namespace RiskGame.Persistence.Events;

/// <summary>
/// Eén resterend startleger van de speler is bijgeplaatst op een eigen gebied, tijdens
/// <see cref="Rules.State.GamePhase.InitialPlacement"/> (FO §5.1: "1 per keer, klassiek").
/// </summary>
public sealed record InitialArmyPlaced(string GameId, string PlayerId, string TerritoryId);
