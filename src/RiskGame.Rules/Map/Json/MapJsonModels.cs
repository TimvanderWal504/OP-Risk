namespace RiskGame.Rules.Map.Json;

// Losse serialisatiemodellen, bewust gescheiden van de domeintypes: de vorm van een
// JSON-bestand mag veranderen zonder dat het domein meebeweegt, en het domein hoeft
// geen nullable velden te kennen die alleen tijdens het inlezen bestaan.
// Alle velden zijn nullable omdat een bestand nu eenmaal onvolledig kan zijn; de parser
// maakt daar begrijpelijke foutmeldingen van.

internal sealed class TerritoryJson
{
    public string? Id { get; init; }

    public string? Name { get; init; }

    public string? Continent { get; init; }

    public double[]? Centroid { get; init; }
}

internal sealed class BordersFileJson
{
    public List<BorderJson>? Borders { get; init; }
}

internal sealed class BorderJson
{
    public string? From { get; init; }

    public string? To { get; init; }

    public string? Type { get; init; }
}

internal sealed class ContinentsFileJson
{
    public List<ContinentJson>? Continents { get; init; }
}

internal sealed class ContinentJson
{
    public string? Id { get; init; }

    public string? Name { get; init; }

    public int? Bonus { get; init; }
}

internal sealed class ColorsFileJson
{
    public List<ColorJson>? Colors { get; init; }
}

internal sealed class ColorJson
{
    public string? Id { get; init; }

    public string? Name { get; init; }

    public string? Hex { get; init; }

    public string? Symbol { get; init; }
}

internal sealed class CardsFileJson
{
    public Dictionary<string, Dictionary<string, string>>? Themes { get; init; }

    public SetRulesJson? SetRules { get; init; }

    public DeckJson? Deck { get; init; }
}

internal sealed class SetRulesJson
{
    public List<string>? ValidSets { get; init; }

    public bool? JokerIsWild { get; init; }

    public int? OwnedTerritoryBonus { get; init; }
}

internal sealed class DeckJson
{
    public List<string>? Symbols { get; init; }

    public int? JokerCount { get; init; }
}

internal sealed class MissionsFileJson
{
    public List<MissionJson>? Missions { get; init; }
}

internal sealed class MissionJson
{
    public string? Id { get; init; }

    public string? Type { get; init; }

    public string? Name { get; init; }

    public string? Description { get; init; }

    public bool? RequiresOwnTurn { get; init; }

    public string? FallbackMissionId { get; init; }

    public MissionParamsJson? Params { get; init; }
}

// Eén platte params-vorm voor alle missietypes: bespaart polymorfe deserialisatie; de
// parser kiest per type welke velden hij nodig heeft en klaagt over wat ontbreekt.
internal sealed class MissionParamsJson
{
    public List<string>? Continents { get; init; }

    public bool? ExtraAnyContinent { get; init; }

    public int? Count { get; init; }

    public int? MinArmies { get; init; }

    public string? TargetColor { get; init; }
}

internal sealed class EventsFileJson
{
    public List<EventJson>? Events { get; init; }
}

internal sealed class EventJson
{
    public string? Id { get; init; }

    public string? Name { get; init; }

    public string? Description { get; init; }

    public string? Duration { get; init; }

    public EventEffectJson? Effect { get; init; }
}

internal sealed class EventEffectJson
{
    public string? Type { get; init; }

    public EventEffectParamsJson? Params { get; init; }
}

internal sealed class EventEffectParamsJson
{
    public int? Amount { get; init; }

    public List<string>? TerritoryIds { get; init; }

    public List<RouteJson>? Routes { get; init; }
}

internal sealed class RouteJson
{
    public string? From { get; init; }

    public string? To { get; init; }
}

internal sealed class RolesFileJson
{
    public List<RoleJson>? Roles { get; init; }
}

internal sealed class RoleJson
{
    public string? Id { get; init; }

    public string? Name { get; init; }

    public string? OriginTerritory { get; init; }

    public string? Description { get; init; }

    public RoleEffectJson? Effect { get; init; }
}

internal sealed class RoleEffectJson
{
    public string? Type { get; init; }

    public RoleEffectParamsJson? Params { get; init; }
}

internal sealed class RoleEffectParamsJson
{
    public int? Amount { get; init; }

    public int? PerTurn { get; init; }

    public bool? ThroughEnemy { get; init; }

    public int? Moves { get; init; }
}
