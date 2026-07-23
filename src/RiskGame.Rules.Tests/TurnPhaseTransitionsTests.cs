using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests;

public class TurnPhaseTransitionsTests
{
    [Theory]
    [InlineData(TurnPhase.Reinforce, TurnPhase.Attack)]
    [InlineData(TurnPhase.Attack, TurnPhase.Fortify)]
    public void Next_GeeftDeVolgendeFaseInDeBeurtstructuur(TurnPhase current, TurnPhase expected)
    {
        Assert.Equal(expected, TurnPhaseTransitions.Next(current));
    }

    [Fact]
    public void Next_VanuitVerplaatsen_Gooit()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => TurnPhaseTransitions.Next(TurnPhase.Fortify));
    }
}
