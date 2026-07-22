namespace RiskGame.Rules.Map;

/// <summary>
/// Territoriumkaart. <paramref name="TerritoryId"/> is <c>null</c> bij een joker: die
/// hoort bij geen enkel gebied en levert daarom nooit de bezitsbonus op.
/// </summary>
public sealed record Card(string Id, string? TerritoryId, string Symbol)
{
    public bool IsJoker => TerritoryId is null;
}
