using System.Text.Json;

namespace RiskGame.Rules.Tests;

/// <summary>
/// De engine laadt territories.geo.json niet (dat is frontend-data, TO §3.2), maar
/// zonder deze controle kan er een gat groeien tussen speldata en kaartweergave dat pas
/// in bouwstap 5 zichtbaar wordt: een gebied zonder polygon is onzichtbaar en
/// onklikbaar, een polygon zonder gebied is een dood klikvlak.
/// </summary>
public class GeoPariteitTests
{
    private static HashSet<string> GeoTerritoryIds()
    {
        using var document = JsonDocument.Parse(Standaard43Data.Json("territories.geo.json"));

        return document.RootElement
            .GetProperty("features")
            .EnumerateArray()
            .Select(feature => feature.GetProperty("properties").GetProperty("id").GetString()!)
            .ToHashSet(StringComparer.Ordinal);
    }

    [Fact]
    public void ElkGebied_HeeftEenPolygonInGeoJson()
    {
        var map = Standaard43Data.Load();
        var geoIds = GeoTerritoryIds();

        var missing = map.Territories
            .Select(territory => territory.Id)
            .Where(id => !geoIds.Contains(id))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }

    [Fact]
    public void ElkePolygon_HoortBijEenBestaandGebied()
    {
        var map = Standaard43Data.Load();

        var orphans = GeoTerritoryIds()
            .Where(id => !map.HasTerritory(id))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(orphans);
    }

    [Fact]
    public void NieuwZeeland_StaatInBeideBestanden()
    {
        Assert.True(Standaard43Data.Load().HasTerritory("new-zealand"));
        Assert.Contains("new-zealand", GeoTerritoryIds());
    }
}
