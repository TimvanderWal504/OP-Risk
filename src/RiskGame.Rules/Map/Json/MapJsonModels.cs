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
