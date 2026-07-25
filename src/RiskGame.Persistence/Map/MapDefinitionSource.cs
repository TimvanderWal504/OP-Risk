using RiskGame.Rules.Map;

namespace RiskGame.Persistence.Map;

/// <summary>
/// Leest de JSON van een kaartvariant van schijf en parseert die via de bestaande,
/// ongewijzigde <see cref="MapDefinitionParser"/>. I/O hoort hier, niet in
/// <c>RiskGame.Rules</c> (CLAUDE.md, TO §3.2).
/// </summary>
/// <param name="mapsRootPath">Map met één submap per kaartvariant-id, bijvoorbeeld
/// <c>data/maps</c> — elke submap bevat de bestanden die <see cref="MapDataSources"/>
/// verwacht. Uitzondering: <c>colors.json</c> is gedeeld over alle kaartvarianten en
/// staat één niveau hoger, in de parent van <paramref name="mapsRootPath"/>
/// (dus <c>data/colors.json</c>).</param>
public sealed class MapDefinitionSource(string mapsRootPath) : IMapDefinitionSource
{
    public MapDefinition Load(string mapId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(mapId);

        var mapDirectory = Path.Combine(mapsRootPath, mapId);
        var dataRootPath = Path.GetDirectoryName(mapsRootPath)
            ?? throw new InvalidOperationException(
                $"Kan de gedeelde data-root niet afleiden van mapsRootPath '{mapsRootPath}'.");

        var sources = new MapDataSources(
            Json(mapDirectory, "territories.json"),
            Json(mapDirectory, "adjacency_validated.json"),
            Json(mapDirectory, "continents.json"),
            Json(dataRootPath, "colors.json"),
            Json(mapDirectory, "cards.json"),
            Json(mapDirectory, "missions.json"),
            Json(mapDirectory, "events.json"),
            Json(mapDirectory, "roles.json"));

        var result = MapDefinitionParser.Parse(mapId, sources);

        if (!result.IsSuccess)
        {
            throw new InvalidOperationException(
                $"Kaartvariant '{mapId}' is ongeldig: {string.Join(" | ", result.Errors)}");
        }

        return result.Value;
    }

    private static string Json(string mapDirectory, string fileName) =>
        File.ReadAllText(Path.Combine(mapDirectory, fileName));
}
