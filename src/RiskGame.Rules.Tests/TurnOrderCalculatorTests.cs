using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests;

public class TurnOrderCalculatorTests
{
    private static GameState ThreePlayerGame(
        bool p2Eliminated = false, bool p2AutoPass = false, bool p3Eliminated = false) =>
        TestGame.InProgress(
        [
            TestGame.Player("p1", "red"),
            TestGame.Player("p2", "blue", isEliminated: p2Eliminated, isAutoPass: p2AutoPass),
            TestGame.Player("p3", "green", isEliminated: p3Eliminated),
        ]);

    [Fact]
    public void VolgendeSpeler_IsDeEerstvolgendeInDeBeurtvolgorde()
    {
        var state = ThreePlayerGame();

        Assert.Equal("p2", TurnOrderCalculator.NextActivePlayerId(state));
    }

    [Fact]
    public void VolgendeSpeler_LooptRondNaarHetBeginVanDeVolgorde()
    {
        var state = ThreePlayerGame().WithTurnState(new TurnState("p3", TurnPhase.Fortify, null, null));

        Assert.Equal("p1", TurnOrderCalculator.NextActivePlayerId(state));
    }

    [Fact]
    public void VolgendeSpeler_SlaatEenUitgeschakeldeSpelerOver()
    {
        var state = ThreePlayerGame(p2Eliminated: true);

        Assert.Equal("p3", TurnOrderCalculator.NextActivePlayerId(state));
    }

    [Fact]
    public void VolgendeSpeler_SlaatEenAutoPassSpelerOver()
    {
        var state = ThreePlayerGame(p2AutoPass: true);

        Assert.Equal("p3", TurnOrderCalculator.NextActivePlayerId(state));
    }

    [Fact]
    public void VolgendeSpeler_IsNullAlsNiemandAndersInAanmerkingKomt()
    {
        var state = ThreePlayerGame(p2Eliminated: true, p3Eliminated: true);

        Assert.Null(TurnOrderCalculator.NextActivePlayerId(state));
    }

    [Fact]
    public void VolgendeSpeler_IsNullZonderLopendeBeurt()
    {
        var state = ThreePlayerGame().WithTurnState(null);

        Assert.Null(TurnOrderCalculator.NextActivePlayerId(state));
    }
}
