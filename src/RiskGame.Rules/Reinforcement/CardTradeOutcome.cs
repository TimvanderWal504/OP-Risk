namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Uitkomst van het inleveren van een geldige kaartenset (FO §4.4). <see cref="SetValue"/>
/// gaat in de vrije versterkingspool; <see cref="OwnedTerritoryBonuses"/> zijn losse
/// legers die verplicht op dat specifieke gebied geplaatst worden, dus niet vrij
/// verdeelbaar en daarom niet in <see cref="SetValue"/> meegeteld.
/// </summary>
/// <param name="PoolBonus">
/// Bezitsbonussen van afgesloten gebieden (FO §9.2): daar komen geen legers bij, dus gaan ze
/// in de vrije pool (besluit gebruiker 2026-10-01). Apart van <see cref="SetValue"/>, dat
/// "de setwaarde" blijft — voor het verloop en de terugdraai bij een timeout.
/// </param>
public sealed record CardTradeOutcome(
    int SetValue,
    IReadOnlyList<TerritoryBonus> OwnedTerritoryBonuses,
    int PoolBonus);

/// <summary>Bezitsbonus-legers die verplicht op <paramref name="TerritoryId"/> komen.</summary>
public sealed record TerritoryBonus(string TerritoryId, int Amount);
