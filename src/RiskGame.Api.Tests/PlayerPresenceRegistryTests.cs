using Microsoft.Extensions.Time.Testing;
using RiskGame.Api.Services;

namespace RiskGame.Api.Tests;

public sealed class PlayerPresenceRegistryTests
{
    private readonly FakeTimeProvider _clock = new(new DateTimeOffset(2026, 10, 1, 20, 0, 0, TimeSpan.Zero));

    [Fact]
    public void IsConnectionOf_HoortAlleenBijDeGeregistreerdeSpelerInDitSpel()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "game-1", "p1");

        Assert.True(registry.IsConnectionOf("c1", "game-1", "p1"));
        Assert.False(registry.IsConnectionOf("c1", "game-1", "p2"));
        Assert.False(registry.IsConnectionOf("c1", "game-2", "p1"));
        Assert.False(registry.IsConnectionOf("c2", "game-1", "p1"));
    }

    [Fact]
    public void AbsentSince_EenSpelerDieNooitVerbondenWas_IsOnbekend()
    {
        var registry = new PlayerPresenceRegistry(_clock);

        Assert.Null(registry.AbsentSince("game-1", "p1"));
    }

    [Fact]
    public void AbsentSince_NaHetSluitenVanDeLaatsteConnectie_IsHetMomentVanSluiten()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "game-1", "p1");
        Assert.Null(registry.AbsentSince("game-1", "p1"));

        registry.Unregister("c1");

        Assert.Equal(_clock.GetUtcNow(), registry.AbsentSince("game-1", "p1"));
        Assert.False(registry.IsConnectionOf("c1", "game-1", "p1"));
    }

    /// <summary>Een tweede tabblad houdt de speler aanwezig tot ook dat sluit.</summary>
    [Fact]
    public void AbsentSince_MetEenTweedeConnectie_PasWegAlsDieOokSluit()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "game-1", "p1");
        registry.Register("c2", "game-1", "p1");

        registry.Unregister("c1");
        Assert.Null(registry.AbsentSince("game-1", "p1"));

        _clock.Advance(TimeSpan.FromSeconds(30));
        registry.Unregister("c2");
        Assert.Equal(_clock.GetUtcNow(), registry.AbsentSince("game-1", "p1"));
    }

    [Fact]
    public void Register_NaWegzijn_IsDeSpelerWeerAanwezig()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "game-1", "p1");
        registry.Unregister("c1");

        registry.Register("c2", "game-1", "p1");

        Assert.Null(registry.AbsentSince("game-1", "p1"));
    }

    /// <summary>Een connectie hoort bij hooguit één speler: opnieuw registreren verhuist hem.</summary>
    [Fact]
    public void Register_DezelfdeConnectieVoorEenAndereSpeler_LaatDeEersteSpelerAchterAlsWeg()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "game-1", "p1");

        registry.Register("c1", "game-1", "p2");

        Assert.True(registry.IsConnectionOf("c1", "game-1", "p2"));
        Assert.False(registry.IsConnectionOf("c1", "game-1", "p1"));
        Assert.Equal(_clock.GetUtcNow(), registry.AbsentSince("game-1", "p1"));
    }

    [Fact]
    public void Unregister_EenOnbekendeConnectie_DoetNiets()
    {
        var registry = new PlayerPresenceRegistry(_clock);

        registry.Unregister("onbekend");

        Assert.Null(registry.AbsentSince("game-1", "p1"));
    }
}
