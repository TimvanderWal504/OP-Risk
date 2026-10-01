namespace RiskGame.Rules.Tests;

/// <summary>
/// Verwijzingen vanuit de content naar gebieden die de parser niet zelf afdwingt. Een rol
/// met een onbekend herkomstland laat de kaart wel laden, maar faalt pas bij de spelstart
/// (FO §8, §13) — deze test haalt dat naar voren, per kaartvariant.
/// </summary>
public class KaartReferentieTests
{
    public static TheoryData<string> MapIds() => MapTestData.MapIds();

    [Theory]
    [MemberData(nameof(MapIds))]
    public void ElkRolHerkomstland_BestaatOpDeKaart(string mapId)
    {
        var map = MapTestData.Load(mapId);

        var unknown = map.Roles
            .Where(role => !map.HasTerritory(role.OriginTerritory))
            .Select(role => $"{role.Id} → {role.OriginTerritory}")
            .ToList();

        Assert.Empty(unknown);
    }
}
