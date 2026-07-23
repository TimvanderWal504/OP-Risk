namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft een vrij gebied geclaimd tijdens <see cref="Rules.State.GamePhase.Claiming"/>
/// (FO §5.1). Het claimen zelf plaatst meteen 1 leger — "resterende legers" worden pas
/// daarna, in <see cref="Rules.State.GamePhase.InitialPlacement"/>, om beurten bijgeplaatst
/// (<see cref="InitialArmyPlaced"/>), wat alleen betekenis heeft als claimen al legers
/// verbruikt.
/// </summary>
public sealed record TerritoryClaimed(string GameId, string PlayerId, string TerritoryId);
