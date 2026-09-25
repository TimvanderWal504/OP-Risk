using RiskGame.Api.Services;

namespace RiskGame.Api.Tests;

public sealed class TvPairingRegistryTests
{
    [Fact]
    public void TryClaim_MetUitgegevenCode_LevertDeConnectieEenmaligOp()
    {
        var registry = new TvPairingRegistry();
        var code = registry.Register("tv-1");

        Assert.True(registry.TryClaim(code, out var connectionId));
        Assert.Equal("tv-1", connectionId);
        Assert.False(registry.TryClaim(code, out _));
    }

    [Fact]
    public void TryClaim_MetKleineLetters_VindtDeCodeEnRuimtDeConnectieOp()
    {
        var registry = new TvPairingRegistry();
        var code = registry.Register("tv-1");

        Assert.True(registry.TryClaim(code.ToLowerInvariant(), out _));

        // De connectie wijst nergens meer naar: opnieuw registreren en die code claimen moet schoon werken.
        var next = registry.Register("tv-1");
        Assert.True(registry.TryClaim(next, out var connectionId));
        Assert.Equal("tv-1", connectionId);
    }

    [Fact]
    public void Remove_BijDisconnect_MaaktDeCodeOngeldig()
    {
        var registry = new TvPairingRegistry();
        var code = registry.Register("tv-1");

        registry.Remove("tv-1");

        Assert.False(registry.TryClaim(code, out _));
    }

    [Fact]
    public void Register_VoorDezelfdeConnectie_LaatDeVorigeCodeVervallen()
    {
        var registry = new TvPairingRegistry();
        var first = registry.Register("tv-1");
        var second = registry.Register("tv-1");

        Assert.False(registry.TryClaim(first, out _));
        Assert.True(registry.TryClaim(second, out _));
    }

    [Fact]
    public void Remove_VanEenConnectie_RaaktDeCodeVanEenAndereTvNiet()
    {
        var registry = new TvPairingRegistry();
        registry.Register("tv-1");
        var other = registry.Register("tv-2");

        registry.Remove("tv-1");

        Assert.True(registry.TryClaim(other, out var connectionId));
        Assert.Equal("tv-2", connectionId);
    }
}
