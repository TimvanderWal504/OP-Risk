using System.Text.Json;

namespace RiskGame.Persistence.Map;

/// <summary>Lobby-metadata van één kaartvariant uit <c>data/maps/{mapId}/map.json</c> (FO §4.5, §10).</summary>
public sealed record MapVariant(string MapId, bool IsDefault, string DefaultStartingArmiesPresetId);

/// <summary>
/// De kaartvarianten die bestaan: elke submap van <c>data/maps</c> met een <c>map.json</c>.
/// Eén keer bij het opstarten ingelezen. Dit is de lijst waartegen een <c>mapId</c> van een
/// client wordt gecontroleerd vóórdat er een pad mee gebouwd wordt — alleen een exact bekende
/// mapnaam komt erdoor, dus geen <c>..</c> of padscheidingstekens.
/// </summary>
public sealed class MapCatalog : IMapCatalog
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly Dictionary<string, MapVariant> _byId;

    public MapCatalog(string mapsRootPath)
    {
        Variants = Directory.GetDirectories(mapsRootPath)
            .Where(directory => File.Exists(Path.Combine(directory, "map.json")))
            .Select(directory => Read(Path.GetFileName(directory), Path.Combine(directory, "map.json")))
            .OrderBy(variant => variant.MapId, StringComparer.Ordinal)
            .ToArray();

        var defaults = Variants.Count(variant => variant.IsDefault);
        if (defaults != 1)
        {
            throw new InvalidOperationException(
                $"Precies één kaartvariant in '{mapsRootPath}' moet 'isDefault: true' hebben, gevonden: {defaults}.");
        }

        _byId = Variants.ToDictionary(variant => variant.MapId, StringComparer.Ordinal);
    }

    public IReadOnlyList<MapVariant> Variants { get; }

    // Null-check: mapId komt van de client (JSON), en een ontbrekend veld kan ondanks het
    // niet-nullable type als null binnenkomen.
    public bool Contains(string mapId) => mapId is not null && _byId.ContainsKey(mapId);

    private static MapVariant Read(string mapId, string path)
    {
        var model = JsonSerializer.Deserialize<MapJsonModel>(File.ReadAllText(path), JsonOptions);

        if (model is null || string.IsNullOrWhiteSpace(model.DefaultStartingArmiesPresetId))
        {
            throw new InvalidOperationException($"{path}: 'defaultStartingArmiesPresetId' ontbreekt.");
        }

        return new MapVariant(mapId, model.IsDefault, model.DefaultStartingArmiesPresetId);
    }

    private sealed record MapJsonModel(bool IsDefault, string? DefaultStartingArmiesPresetId);
}
