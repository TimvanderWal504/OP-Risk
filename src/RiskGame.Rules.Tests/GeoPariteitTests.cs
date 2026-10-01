using System.Text.Json;
using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// De engine laadt territories.geo.json niet (dat is frontend-data, TO §3.2), maar
/// zonder deze controle kan er een gat groeien tussen speldata en kaartweergave dat pas
/// in bouwstap 5 zichtbaar wordt: een gebied zonder polygon is onzichtbaar en
/// onklikbaar, een polygon zonder gebied is een dood klikvlak.
/// </summary>
public class GeoPariteitTests
{
    /// <summary>
    /// Twee gebieden "raken" als een hoekpunt van het ene binnen deze afstand (in graden)
    /// van een rand van het andere ligt. Gebieden uit verschillende Natural Earth-lagen
    /// (land vs. provincie) delen geen exact gelijke hoekpunten, dus exacte gelijkheid is
    /// te streng. De ondergrens wordt bepaald door één bijna-raakgrens:
    /// <c>northwest-territory–quebec</c> raakt pas tussen 0,01° en 0,05° (~1–5 km), en is
    /// bewust een landgrens. Met 0,05° wordt elke landgrens van standaard-43 gevonden
    /// zonder er één te veel op te leveren.
    /// </summary>
    private const double TouchTolerance = 0.05;

    /// <summary>Rasterbreedte (graden) waarmee randen vooraf per cel worden ingedeeld.</summary>
    private const double GridCellSize = 0.5;

    /// <summary>
    /// Landgrenzen die bewust bestaan terwijl de polygonen elkaar niet raken (FO §4.2:
    /// hier wint het klassieke spelbord van de precieze geografie).
    /// </summary>
    private static readonly HashSet<(string, string)> LandBordersWithoutContact =
    [
        ("central-america", "eastern-united-states"),
    ];

    public static TheoryData<string> MapIds() => MapTestData.MapIds();

    private static Dictionary<string, List<double[][]>> GeoRings(string mapId)
    {
        using var document = JsonDocument.Parse(MapTestData.Json(mapId, "territories.geo.json"));

        var rings = new Dictionary<string, List<double[][]>>(StringComparer.Ordinal);
        foreach (var feature in document.RootElement.GetProperty("features").EnumerateArray())
        {
            var id = feature.GetProperty("properties").GetProperty("id").GetString()!;
            var geometry = feature.GetProperty("geometry");
            var coordinates = geometry.GetProperty("coordinates");
            var polygons = geometry.GetProperty("type").GetString() == "MultiPolygon"
                ? coordinates.EnumerateArray().ToList()
                : [coordinates];

            rings[id] = polygons
                .SelectMany(polygon => polygon.EnumerateArray())
                .Select(ring => ring.EnumerateArray()
                    .Select(point => new[] { point[0].GetDouble(), point[1].GetDouble() })
                    .ToArray())
                .ToList();
        }

        return rings;
    }

    [Theory]
    [MemberData(nameof(MapIds))]
    public void ElkGebied_HeeftEenPolygonInGeoJson(string mapId)
    {
        var map = MapTestData.Load(mapId);
        var geoIds = GeoRings(mapId).Keys;

        var missing = map.Territories
            .Select(territory => territory.Id)
            .Where(id => !geoIds.Contains(id))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(missing);
    }

    [Theory]
    [MemberData(nameof(MapIds))]
    public void ElkePolygon_HoortBijEenBestaandGebied(string mapId)
    {
        var map = MapTestData.Load(mapId);

        var orphans = GeoRings(mapId).Keys
            .Where(id => !map.HasTerritory(id))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(orphans);
    }

    /// <summary>
    /// FO §4.2: elke landgrens raakt ook geometrisch, en elk rakend paar is een landgrens.
    /// </summary>
    [Theory]
    [MemberData(nameof(MapIds))]
    public void Landgrenzen_KomenOvereenMetDeGeometrie(string mapId)
    {
        var map = MapTestData.Load(mapId);
        var touching = TouchingPairs(GeoRings(mapId));
        var landBorders = map.Borders
            .Where(border => border.Type == BorderType.Land)
            .Select(border => Pair(border.From, border.To))
            .ToHashSet();

        var landWithoutContact = landBorders
            .Where(pair => !touching.Contains(pair) && !LandBordersWithoutContact.Contains(pair))
            .Order()
            .ToList();
        var contactWithoutLand = touching
            .Where(pair => !landBorders.Contains(pair))
            .Order()
            .ToList();

        Assert.Empty(landWithoutContact);
        Assert.Empty(contactWithoutLand);
    }

    [Fact]
    public void NieuwZeeland_StaatInBeideBestanden()
    {
        Assert.True(Standaard43Data.Load().HasTerritory("new-zealand"));
        Assert.Contains("new-zealand", GeoRings(Standaard43Data.MapId).Keys);
    }

    private static (string, string) Pair(string a, string b) =>
        string.CompareOrdinal(a, b) < 0 ? (a, b) : (b, a);

    private static HashSet<(string, string)> TouchingPairs(Dictionary<string, List<double[][]>> rings)
    {
        var grid = new Dictionary<(int, int), List<(string Id, double[] A, double[] B)>>();
        foreach (var (id, territoryRings) in rings)
        {
            foreach (var ring in territoryRings)
            {
                for (var i = 0; i < ring.Length - 1; i++)
                {
                    var (a, b) = (ring[i], ring[i + 1]);
                    for (var x = Cell(Math.Min(a[0], b[0]) - TouchTolerance); x <= Cell(Math.Max(a[0], b[0]) + TouchTolerance); x++)
                    {
                        for (var y = Cell(Math.Min(a[1], b[1]) - TouchTolerance); y <= Cell(Math.Max(a[1], b[1]) + TouchTolerance); y++)
                        {
                            if (!grid.TryGetValue((x, y), out var segments))
                            {
                                grid[(x, y)] = segments = [];
                            }

                            segments.Add((id, a, b));
                        }
                    }
                }
            }
        }

        var touching = new HashSet<(string, string)>();
        foreach (var (id, territoryRings) in rings)
        {
            foreach (var point in territoryRings.SelectMany(ring => ring))
            {
                if (!grid.TryGetValue((Cell(point[0]), Cell(point[1])), out var segments))
                {
                    continue;
                }

                foreach (var segment in segments)
                {
                    if (segment.Id != id && DistanceToSegment(point, segment.A, segment.B) < TouchTolerance)
                    {
                        touching.Add(Pair(id, segment.Id));
                    }
                }
            }
        }

        return touching;
    }

    private static int Cell(double degrees) => (int)Math.Floor(degrees / GridCellSize);

    private static double DistanceToSegment(double[] p, double[] a, double[] b)
    {
        var (dx, dy) = (b[0] - a[0], b[1] - a[1]);
        var lengthSquared = dx * dx + dy * dy;
        var t = lengthSquared == 0
            ? 0
            : Math.Clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared, 0, 1);

        return Math.Sqrt(Math.Pow(p[0] - (a[0] + t * dx), 2) + Math.Pow(p[1] - (a[1] + t * dy), 2));
    }
}
