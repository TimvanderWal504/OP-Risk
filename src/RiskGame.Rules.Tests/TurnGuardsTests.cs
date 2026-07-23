using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests;

public class TurnGuardsTests
{
    [Fact]
    public void EndPhase_VanuitVersterken_IsGeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void EndPhase_VanuitAanvallenZonderLopendGevecht_IsGeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void EndPhase_VanuitAanvallenMetLopendGevecht_IsOngeldig()
    {
        var state = TestGame.InProgress(
            turnPhase: TurnPhase.Attack,
            pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 1));

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Contains("loopt nog een gevecht", result.Errors.Single());
    }

    [Fact]
    public void EndPhase_VanuitVerplaatsen_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Contains("gebruik EndTurn", result.Errors.Single());
    }

    [Fact]
    public void EndPhase_DoorSpelerDieNietAanDeBeurtIs_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce);

        var result = TurnGuards.CanEndPhase(state, "p2");

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void EndTurn_VanuitVerplaatsen_IsGeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify);

        var result = TurnGuards.CanEndTurn(state, "p1");

        Assert.True(result.IsSuccess);
    }

    [Theory]
    [InlineData(TurnPhase.Reinforce)]
    [InlineData(TurnPhase.Attack)]
    public void EndTurn_BuitenVerplaatsen_IsOngeldig(TurnPhase turnPhase)
    {
        var state = TestGame.InProgress(turnPhase: turnPhase);

        var result = TurnGuards.CanEndTurn(state, "p1");

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void EndTurn_DoorSpelerDieNietAanDeBeurtIs_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify);

        var result = TurnGuards.CanEndTurn(state, "p2");

        Assert.False(result.IsSuccess);
    }
}
