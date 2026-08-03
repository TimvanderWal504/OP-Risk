using System.Collections.Concurrent;
using RiskGame.Rules.Map;

namespace RiskGame.Persistence.Map;

/// <summary>
/// Leest de JSON van een kaartvariant van schijf en parseert die via de bestaande,
/// ongewijzigde <see cref="MapDefinitionParser"/>. I/O hoort hier, niet in
/// <c>RiskGame.Rules</c> (CLAUDE.md, TO §3.2).
/// </summary>
/// <param name="mapsRootPath">Map met één submap per kaartvariant-id, bijvoorbeeld
/// <c>data/maps</c> — elke submap bevat de bestanden die <see cref="MapDataSources"/>
/// verwacht. Uitzondering: <c>colors.json</c> en <c>starting-armies-presets.json</c> zijn
/// gedeeld over alle kaartvarianten en staan één niveau hoger, in de parent van
/// <paramref name="mapsRootPath"/> (dus <c>data/colors.json</c>).</param>
public sealed class MapDefinitionSource(string mapsRootPath) : IMapDefinitionSource
{
    /// <summary>
    /// Per source-instantie, bewust niet static: twee bronnen met een andere <c>mapsRootPath</c>
    /// horen onafhankelijke <see cref="MapDefinition"/>-instanties op te leveren (zie de
    /// opmerking op <see cref="MapDefinition"/> zelf). Binnen één bron is <c>mapId</c> de
    /// volledige sleutel — het is de enige parameter van <see cref="Load"/>.
    /// </summary>
    /// <remarks>
    /// Zonder deze cache betaalt élke deserialisatie van een <c>GameState</c> een volledige
    /// kaartinlees: <c>MapDefinitionJsonConverter</c> roept <see cref="Load"/> aan, en die zit
    /// daarmee op het pad van elke document-load, elke queryrij en elke inline-projectie.
    /// <see cref="MapDefinition"/> is immutable, dus dezelfde instantie delen is veilig.
    /// <see cref="ConcurrentDictionary{TKey,TValue}"/> kan zijn factory bij gelijktijdigheid meer
    /// dan eens uitvoeren; dat is hier onschadelijk (een pure parse zonder neveneffecten) en
    /// bewust niet met een lock "opgelost".
    /// </remarks>
    private readonly ConcurrentDictionary<string, MapDefinition> _cache = new(StringComparer.Ordinal);

    public MapDefinition Load(string mapId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(mapId);

        return _cache.GetOrAdd(mapId, LoadFromDisk);
    }

    private MapDefinition LoadFromDisk(string mapId)
    {
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
            Json(mapDirectory, "roles.json"),
            Json(dataRootPath, "starting-armies-presets.json"));

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
