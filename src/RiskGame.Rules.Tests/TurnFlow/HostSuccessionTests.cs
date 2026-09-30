using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests.TurnFlow;

public class HostSuccessionTests
{
    private static GameState Spel(string hostId, bool p2Eliminated = false, bool p3AutoPass = false) =>
        TestGame.InProgress(players:
        [
            TestGame.Player("p1", "red", isHost: hostId == "p1"),
            TestGame.Player("p2", "blue", isHost: hostId == "p2", isEliminated: p2Eliminated),
            TestGame.Player("p3", "green", isHost: hostId == "p3", isAutoPass: p3AutoPass),
        ]);

    [Fact]
    public void NieuweHost_IsDeVolgendeSpelerInDeBeurtvolgorde()
    {
        Assert.Equal("p2", HostSuccession.NextHostId(Spel(hostId: "p1")));
    }

    [Fact]
    public void NieuweHost_NaDeLaatsteSpeler_BegintWeerVooraan()
    {
        Assert.Equal("p1", HostSuccession.NextHostId(Spel(hostId: "p3")));
    }

    [Fact]
    public void NieuweHost_SlaatUitgeschakeldeSpelersOver()
    {
        Assert.Equal("p3", HostSuccession.NextHostId(Spel(hostId: "p1", p2Eliminated: true)));
    }

    [Fact]
    public void NieuweHost_SlaatSpelersOpAutoPassOver()
    {
        Assert.Equal("p1", HostSuccession.NextHostId(Spel(hostId: "p2", p3AutoPass: true)));
    }

    /// <summary>FO §11.1: zonder geschikte opvolger blijft de host host.</summary>
    [Fact]
    public void NieuweHost_ZonderGeschikteOpvolger_IsErGeen()
    {
        Assert.Null(HostSuccession.NextHostId(Spel(hostId: "p1", p2Eliminated: true, p3AutoPass: true)));
    }
}
