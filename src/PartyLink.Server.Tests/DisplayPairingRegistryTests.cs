using PartyLink.Server.Pairing;

namespace PartyLink.Server.Tests;

public sealed class DisplayPairingRegistryTests
{
    [Fact]
    public void TryClaim_WithIssuedCode_ReturnsTheConnectionOnce()
    {
        var registry = new DisplayPairingRegistry();
        var code = registry.Register("display-1");

        Assert.True(registry.TryClaim(code, out var connectionId));
        Assert.Equal("display-1", connectionId);
        Assert.False(registry.TryClaim(code, out _));
    }

    [Fact]
    public void TryClaim_InLowerCase_FindsTheCodeAndCleansUpTheConnection()
    {
        var registry = new DisplayPairingRegistry();
        var code = registry.Register("display-1");

        Assert.True(registry.TryClaim(code.ToLowerInvariant(), out _));

        // The connection no longer points anywhere: registering again and claiming that code must work cleanly.
        var next = registry.Register("display-1");
        Assert.True(registry.TryClaim(next, out var connectionId));
        Assert.Equal("display-1", connectionId);
    }

    [Fact]
    public void Remove_OnDisconnect_InvalidatesTheCode()
    {
        var registry = new DisplayPairingRegistry();
        var code = registry.Register("display-1");

        registry.Remove("display-1");

        Assert.False(registry.TryClaim(code, out _));
    }

    [Fact]
    public void Register_ForTheSameConnection_ExpiresThePreviousCode()
    {
        var registry = new DisplayPairingRegistry();
        var first = registry.Register("display-1");
        var second = registry.Register("display-1");

        Assert.False(registry.TryClaim(first, out _));
        Assert.True(registry.TryClaim(second, out _));
    }

    [Fact]
    public void Remove_OfOneConnection_LeavesTheCodeOfAnotherDisplayAlone()
    {
        var registry = new DisplayPairingRegistry();
        registry.Register("display-1");
        var other = registry.Register("display-2");

        registry.Remove("display-1");

        Assert.True(registry.TryClaim(other, out var connectionId));
        Assert.Equal("display-2", connectionId);
    }
}
