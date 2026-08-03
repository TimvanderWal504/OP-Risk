namespace RiskGame.Rules.Map;

/// <summary>
/// Eén startlegers-preset (FO §5.1/§10): hoeveel startlegers per speler bij een gegeven
/// spelersaantal (2–7). Namen/beschrijvingen ("Klassiek", "Modern") zijn client-side i18n,
/// niet hier — de server deelt alleen <paramref name="Id"/> en de getallen.
/// </summary>
public sealed record StartingArmiesPreset(string Id, IReadOnlyDictionary<int, int> ArmiesByPlayerCount);
