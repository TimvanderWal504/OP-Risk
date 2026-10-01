using RiskGame.Persistence.Map;

namespace RiskGame.Persistence.Tests;

/// <summary>
/// De regels van <see cref="MapCatalog"/> (FO §4.5, §10), tegen een tijdelijke maps-map zodat
/// elk geval los te bouwen is zonder de echte speeldata te raken.
/// </summary>
public sealed class MapCatalogTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "riskop-mapcatalog-" + Guid.NewGuid().ToString("N"));

    public MapCatalogTests() => Directory.CreateDirectory(_root);

    public void Dispose() => Directory.Delete(_root, recursive: true);

    private void AddMap(string mapId, string? mapJson)
    {
        var directory = Directory.CreateDirectory(Path.Combine(_root, mapId)).FullName;
        if (mapJson is not null)
        {
            File.WriteAllText(Path.Combine(directory, "map.json"), mapJson);
        }
    }

    private static string MapJson(bool isDefault, string presetId = "classic") =>
        $$"""{ "isDefault": {{isDefault.ToString().ToLowerInvariant()}}, "defaultStartingArmiesPresetId": "{{presetId}}" }""";

    [Fact]
    public void LeestElkeMapMetMapJson_GesorteerdOpMapId()
    {
        AddMap("wereld-49", MapJson(false, "classic-49"));
        AddMap("standaard-43", MapJson(true));

        var catalog = new MapCatalog(_root);

        Assert.Equal(
            [new MapVariant("standaard-43", true, "classic"), new MapVariant("wereld-49", false, "classic-49")],
            catalog.Variants);
    }

    [Fact]
    public void EenMapZonderMapJson_IsGeenVariant()
    {
        AddMap("standaard-43", MapJson(true));
        AddMap("half-af", mapJson: null);

        var catalog = new MapCatalog(_root);

        Assert.False(catalog.Contains("half-af"));
        Assert.Single(catalog.Variants);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2)]
    public void NietPreciesEenStandaardkaart_StoptHetOpstarten(int defaults)
    {
        AddMap("a", MapJson(defaults >= 1));
        AddMap("b", MapJson(defaults >= 2));

        Assert.Throws<InvalidOperationException>(() => new MapCatalog(_root));
    }

    [Fact]
    public void ZonderStandaardpreset_StoptHetOpstarten()
    {
        AddMap("standaard-43", """{ "isDefault": true }""");

        Assert.Throws<InvalidOperationException>(() => new MapCatalog(_root));
    }

    [Theory]
    [InlineData("standaard-43", true)]
    [InlineData("STANDAARD-43", false)]
    [InlineData("../standaard-43", false)]
    [InlineData("standaard-43/", false)]
    [InlineData(null, false)]
    public void Contains_AccepteertAlleenEenExactBekendeMapnaam(string? mapId, bool expected)
    {
        AddMap("standaard-43", MapJson(true));

        Assert.Equal(expected, new MapCatalog(_root).Contains(mapId!));
    }
}
