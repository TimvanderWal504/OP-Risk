namespace RiskGame.Rules.Map;

/// <summary>
/// Regels rond kaarteninleg (FO §4.4). <paramref name="OwnedTerritoryBonus"/> is het
/// aantal extra legers dat je direct op een gebied plaatst als je de kaart van een
/// gebied inlegt dat je op dat moment bezit.
/// </summary>
public sealed record CardSetRules(
    IReadOnlyList<string> ValidSets,
    bool JokerIsWild,
    int OwnedTerritoryBonus);
