using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Leest de echte speeldata van een kaartvariant uit <c>data/maps/{mapId}/</c>. Het lezen
/// van bestanden hoort hier en niet in RiskGame.Rules: de engine blijft vrij van I/O.
/// </summary>
internal static class MapTestData
{
    private static readonly string DataRoot = Path.Combine(AppContext.BaseDirectory, "data");

    /// <summary>
    /// Elke kaartvariant onder <c>data/maps/</c> in de bron, zodat een nieuwe variant
    /// automatisch onder de datatests valt (TO §3.2). De lijst schrijft de build
    /// (<c>WriteMapVariantList</c> in de csproj); de inhoud van bin/ is daarvoor niet
    /// betrouwbaar.
    /// </summary>
    public static TheoryData<string> MapIds()
    {
        var mapIds = File.ReadAllLines(Path.Combine(DataRoot, "map-variants.txt"))
            .Select(line => line.Trim().TrimEnd('\\', '/'))
            .Where(mapId => mapId.Length > 0)
            .Order(StringComparer.Ordinal);

        return new TheoryData<string>(mapIds);
    }

    public static string Json(string mapId, string fileName) =>
        File.ReadAllText(Path.Combine(DataRoot, "maps", mapId, fileName));

    /// <summary>Gedeeld over kaartvarianten, dus in <c>data/</c> zelf (TO §3.2).</summary>
    private static string SharedJson(string fileName) =>
        File.ReadAllText(Path.Combine(DataRoot, fileName));

    public static MapDataSources Sources(string mapId) => new(
        Json(mapId, "territories.json"),
        Json(mapId, "adjacency_validated.json"),
        Json(mapId, "continents.json"),
        SharedJson("colors.json"),
        Json(mapId, "cards.json"),
        Json(mapId, "missions.json"),
        Json(mapId, "events.json"),
        Json(mapId, "roles.json"),
        SharedJson("starting-armies-presets.json"));

    public static MapDefinition Load(string mapId)
    {
        var result = MapDefinitionParser.Parse(mapId, Sources(mapId));

        Assert.True(
            result.IsSuccess,
            $"De echte speeldata van '{mapId}' zou geldig moeten zijn, maar gaf: " + string.Join(" | ", result.Errors));

        return result.Value;
    }
}
