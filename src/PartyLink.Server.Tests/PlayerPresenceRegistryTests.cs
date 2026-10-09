using Microsoft.Extensions.Time.Testing;
using PartyLink.Server.Presence;

namespace PartyLink.Server.Tests;

public sealed class PlayerPresenceRegistryTests
{
    private readonly FakeTimeProvider _clock = new(new DateTimeOffset(2026, 10, 1, 20, 0, 0, TimeSpan.Zero));

    [Fact]
    public void IsConnectionOf_OnlyMatchesTheRegisteredPlayerInThisRoom()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "room-1", "p1");

        Assert.True(registry.IsConnectionOf("c1", "room-1", "p1"));
        Assert.False(registry.IsConnectionOf("c1", "room-1", "p2"));
        Assert.False(registry.IsConnectionOf("c1", "room-2", "p1"));
        Assert.False(registry.IsConnectionOf("c2", "room-1", "p1"));
    }

    [Fact]
    public void AbsentSince_ForAPlayerWhoWasNeverConnected_IsUnknown()
    {
        var registry = new PlayerPresenceRegistry(_clock);

        Assert.Null(registry.AbsentSince("room-1", "p1"));
    }

    [Fact]
    public void AbsentSince_AfterTheLastConnectionCloses_IsTheMomentOfClosing()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "room-1", "p1");
        Assert.Null(registry.AbsentSince("room-1", "p1"));

        registry.Unregister("c1");

        Assert.Equal(_clock.GetUtcNow(), registry.AbsentSince("room-1", "p1"));
        Assert.False(registry.IsConnectionOf("c1", "room-1", "p1"));
    }

    /// <summary>A second tab keeps the player present until that one closes too.</summary>
    [Fact]
    public void AbsentSince_WithASecondConnection_OnlyAbsentWhenThatClosesToo()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "room-1", "p1");
        registry.Register("c2", "room-1", "p1");

        registry.Unregister("c1");
        Assert.Null(registry.AbsentSince("room-1", "p1"));

        _clock.Advance(TimeSpan.FromSeconds(30));
        registry.Unregister("c2");
        Assert.Equal(_clock.GetUtcNow(), registry.AbsentSince("room-1", "p1"));
    }

    [Fact]
    public void Register_AfterBeingAbsent_MakesThePlayerPresentAgain()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "room-1", "p1");
        registry.Unregister("c1");

        registry.Register("c2", "room-1", "p1");

        Assert.Null(registry.AbsentSince("room-1", "p1"));
    }

    /// <summary>A connection belongs to at most one player: registering it again moves it.</summary>
    [Fact]
    public void Register_TheSameConnectionForAnotherPlayer_LeavesTheFirstPlayerAbsent()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "room-1", "p1");

        registry.Register("c1", "room-1", "p2");

        Assert.True(registry.IsConnectionOf("c1", "room-1", "p2"));
        Assert.False(registry.IsConnectionOf("c1", "room-1", "p1"));
        Assert.Equal(_clock.GetUtcNow(), registry.AbsentSince("room-1", "p1"));
    }

    [Fact]
    public void Register_ReturnsThePreviousPlayerOfTheConnection()
    {
        var registry = new PlayerPresenceRegistry(_clock);

        Assert.Null(registry.Register("c1", "room-1", "p1"));
        Assert.Equal(("room-1", "p1"), registry.Register("c1", "room-1", "p2")!.Value);
    }

    [Fact]
    public void ConnectionsOf_ReturnsAllConnectionsOfThePlayerAndNoneOfOthers()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "room-1", "p1");
        registry.Register("c2", "room-1", "p1");
        registry.Register("c3", "room-1", "p2");

        Assert.Equal(["c1", "c2"], registry.ConnectionsOf("room-1", "p1").Order());
        Assert.Empty(registry.ConnectionsOf("room-1", "p9"));
    }

    /// <summary>A copy: the caller cannot change the registry through the result, nor be surprised by it.</summary>
    [Fact]
    public void ConnectionsOf_IsACopyThatDoesNotChange()
    {
        var registry = new PlayerPresenceRegistry(_clock);
        registry.Register("c1", "room-1", "p1");
        var snapshot = registry.ConnectionsOf("room-1", "p1");

        registry.Unregister("c1");

        Assert.Equal(["c1"], snapshot);
        Assert.Empty(registry.ConnectionsOf("room-1", "p1"));
    }

    [Fact]
    public void Unregister_AnUnknownConnection_DoesNothing()
    {
        var registry = new PlayerPresenceRegistry(_clock);

        registry.Unregister("unknown");

        Assert.Null(registry.AbsentSince("room-1", "p1"));
    }
}
