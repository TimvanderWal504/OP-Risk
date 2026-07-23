using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class PlayerStatusTests
{
    [Fact]
    public void DeSpelerAanDeBeurt_IsActive()
    {
        var state = TestGame.InProgress();

        Assert.Equal(PlayerStatus.Active, state.StatusOf("p1"));
    }

    [Fact]
    public void EenSpelerDieNietAanDeBeurtIs_IsWaiting()
    {
        var state = TestGame.InProgress();

        Assert.Equal(PlayerStatus.Waiting, state.StatusOf("p2"));
    }

    [Fact]
    public void EenUitgeschakeldeSpeler_IsEliminated()
    {
        var state = TestGame.InProgress(
            [TestGame.Player("p1", "red"), TestGame.Player("p2", "blue", isEliminated: true)]);

        Assert.Equal(PlayerStatus.Eliminated, state.StatusOf("p2"));
    }

    [Fact]
    public void EenAfwezigeSpeler_IsAutoPass()
    {
        var state = TestGame.InProgress(
            [TestGame.Player("p1", "red"), TestGame.Player("p2", "blue", isAutoPass: true)]);

        Assert.Equal(PlayerStatus.AutoPass, state.StatusOf("p2"));
    }

    [Fact]
    public void EenUitgeschakeldeSpelerAanDeBeurt_IsNooitActive()
    {
        // Uitschakeling gaat vóór "aan de beurt": anders zou een speler die net is
        // uitgeschakeld nog acties mogen doen tot de beurt is doorgeschoven.
        var state = TestGame.InProgress(
            [TestGame.Player("p1", "red", isEliminated: true), TestGame.Player("p2", "blue")]);

        Assert.Equal(PlayerStatus.Eliminated, state.StatusOf("p1"));
    }

    [Fact]
    public void UitschakelingGaatVoorAfwezigheid()
    {
        var state = TestGame.InProgress(
            [
                TestGame.Player("p1", "red"),
                TestGame.Player("p2", "blue", isEliminated: true, isAutoPass: true),
            ]);

        Assert.Equal(PlayerStatus.Eliminated, state.StatusOf("p2"));
    }

    [Fact]
    public void ZonderLopendeBeurt_WachtIedereen()
    {
        var state = TestGame.InProgress().WithTurnState(null);

        Assert.Equal(PlayerStatus.Waiting, state.StatusOf("p1"));
        Assert.Equal(PlayerStatus.Waiting, state.StatusOf("p2"));
    }
}
