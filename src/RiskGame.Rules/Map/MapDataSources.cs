namespace RiskGame.Rules.Map;

/// <summary>
/// De rauwe JSON-inhoud van één kaartvariant. Bewust strings en geen paden of streams:
/// RiskGame.Rules blijft daarmee vrij van I/O, zodat het lezen van bestanden buiten de
/// engine gebeurt (testproject nu, RiskGame.Api in bouwstap 3).
/// </summary>
public sealed record MapDataSources(
    string TerritoriesJson,
    string AdjacencyJson,
    string ContinentsJson,
    string ColorsJson,
    string CardsJson);
