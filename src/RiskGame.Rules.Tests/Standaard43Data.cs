using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Leest de echte speeldata van de standaard-43-kaart. Het lezen van bestanden hoort
/// hier en niet in RiskGame.Rules: de engine blijft vrij van I/O.
/// </summary>
internal static class Standaard43Data
{
    public const string MapId = "standaard-43";

    public static string Json(string fileName) =>
        File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "data", fileName));

    public static MapDataSources Sources() => new(
        Json("territories.json"),
        Json("adjacency_validated.json"),
        Json("continents.json"),
        Json("colors.json"),
        Json("cards.json"));

    public static MapDefinition Load()
    {
        var result = MapDefinitionParser.Parse(MapId, Sources());

        Assert.True(
            result.IsSuccess,
            "De echte speeldata zou geldig moeten zijn, maar gaf: " + string.Join(" | ", result.Errors));

        return result.Value;
    }
}
