using RiskGame.Persistence.Map;

namespace RiskGame.Persistence.Tests;

/// <summary>
/// Legt de cache-belofte van <see cref="MapDefinitionSource"/> vast. Die cache bestaat omdat
/// <c>Load</c> op het deserialisatiepad van elke <c>GameState</c> zit: zonder cache herleest en
/// herparseert elke document-load, elke queryrij en elke inline-projectie de volledige
/// kaartvariant van schijf.
/// </summary>
public sealed class MapDefinitionSourceCacheTests
{
    private static readonly string MapsRoot =
        Path.Combine(AppContext.BaseDirectory, "data", "maps");

    [Fact]
    public void Load_TweeKeerDezelfdeVariantUitDezelfdeBron_LevertDezelfdeInstantie()
    {
        var source = new MapDefinitionSource(MapsRoot);

        Assert.Same(source.Load("standaard-43"), source.Load("standaard-43"));
    }

    /// <summary>
    /// De cache hoort per bron te leven, niet static: twee bronnen kunnen een andere
    /// <c>mapsRootPath</c> hebben, en dan is dezelfde <c>mapId</c> niet dezelfde kaart. Deze
    /// test faalt zodra iemand de cache "optimaliseert" naar een gedeeld static veld.
    /// </summary>
    [Fact]
    public void Load_DezelfdeVariantUitTweeBronnen_LevertOnafhankelijkeInstanties()
    {
        var first = new MapDefinitionSource(MapsRoot);
        var second = new MapDefinitionSource(MapsRoot);

        Assert.NotSame(first.Load("standaard-43"), second.Load("standaard-43"));
    }
}
