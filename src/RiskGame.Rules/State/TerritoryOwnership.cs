namespace RiskGame.Rules.State;

/// <summary>
/// Wie een gebied bezit en met hoeveel legers. De statische kaartdata van het gebied
/// (naam, continent, centroid) staat in <see cref="Map.Territory"/> en wordt hier niet
/// herhaald.
/// </summary>
/// <param name="OwnerPlayerId">
/// Null zolang het gebied nog vrij is: dat komt voor tijdens de claim-fase (FO §5.1) en
/// bij het <c>RevoltOnSingleArmy</c>-effect, dat gebieden neutraal maakt (FO §9.2).
/// </param>
public sealed record TerritoryOwnership(string TerritoryId, string? OwnerPlayerId, int ArmyCount);
