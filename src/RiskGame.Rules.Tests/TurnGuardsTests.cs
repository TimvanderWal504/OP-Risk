using RiskGame.Rules.Map;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests;

public class TurnGuardsTests
{
    private static Card Card(string id, string? territoryId, string symbol) => new(id, territoryId, symbol);

    [Fact]
    public void EndPhase_VanuitVersterken_IsGeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.True(result.IsSuccess);
    }

    /// <summary>
    /// FO §5.2: inleggen bij 5+ kaarten gaat vóór "fase klaar" — zelfs als
    /// <c>ArmiesRemaining</c> al 0 is (alle toegekende legers zijn geplaatst).
    /// </summary>
    [Fact]
    public void EndPhase_VanuitVersterkenMet5OfMeerKaarten_IsOngeldig()
    {
        var hand = Enumerable.Range(0, 5).Select(i => Card($"c{i}", "alaska", "symbol-1")).ToArray();
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };
        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Reinforce, armiesRemaining: 0);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("reinforce.mustTradeInCardsFirst", result.Errors.Single().Code);
    }

    [Fact]
    public void EndPhase_VanuitVersterkenMetOngeplaatsteLegers_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce, armiesRemaining: 3);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("turnFlow.armiesRemaining", result.Errors.Single().Code);
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
            pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 1, CorrelationId: Guid.NewGuid()));

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("turnFlow.combatInProgress", result.Errors.Single().Code);
    }

    /// <summary>FO §7 (taak 4): dezelfde volgorde als Aanvallen zelf — eerst inleggen, dan fase dicht.</summary>
    [Fact]
    public void EndPhase_VanuitAanvallenMetZesOfMeerKaarten_IsOngeldig()
    {
        var hand = Enumerable.Range(0, 6).Select(i => Card($"c{i}", "alaska", "symbol-1")).ToArray();
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };
        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Attack);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("reinforce.mustTradeInCardsFirst", result.Errors.Single().Code);
    }

    [Fact]
    public void EndPhase_VanuitAanvallenMetOngeplaatsteInlegpool_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack, armiesRemaining: 4);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("turnFlow.armiesRemaining", result.Errors.Single().Code);
    }

    [Fact]
    public void EndPhase_VanuitVerplaatsen_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify);

        var result = TurnGuards.CanEndPhase(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("turnFlow.useEndTurnInFortify", result.Errors.Single().Code);
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
