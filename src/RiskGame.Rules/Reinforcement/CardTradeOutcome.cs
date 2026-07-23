namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Uitkomst van het inleveren van een geldige kaartenset (FO §4.4). <see cref="SetValue"/>
/// gaat in de vrije versterkingspool; <see cref="OwnedTerritoryBonuses"/> zijn losse
/// legers die verplicht op dat specifieke gebied geplaatst worden, dus niet vrij
/// verdeelbaar en daarom niet in <see cref="SetValue"/> meegeteld.
/// </summary>
public sealed record CardTradeOutcome(
    int SetValue,
    IReadOnlyList<TerritoryBonus> OwnedTerritoryBonuses);

/// <summary>Bezitsbonus-legers die verplicht op <paramref name="TerritoryId"/> komen.</summary>
public sealed record TerritoryBonus(string TerritoryId, int Amount);
