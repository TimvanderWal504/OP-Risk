using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests;

public sealed class AttritionGuardsTests
{
    private static GameState WachtOpP1(int amount = 2) =>
        TestGame.InProgress()
            .WithTurnState(null)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 4))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 2))
            .WithEventRound(EventRoundState.Empty with
            {
                PendingAttrition = new PendingAttrition("griepgolf", amount, ChooserPlayerIds: ["p1"], AwaitingPlayerIds: ["p1"], NextPlayerId: "p1"),
            });

    [Fact]
    public void RemoveArmies_ZonderLopendeAttrition_IsOngeldig()
    {
        var state = TestGame.InProgress().WithTerritory(new TerritoryOwnership("alaska", "p1", 4));

        var result = AttritionGuards.CanRemoveArmies(state, "p1", new Dictionary<string, int> { ["alaska"] = 2 });

        Assert.Equal("attrition.notPending", Assert.Single(result.Errors).Code);
    }

    [Fact]
    public void RemoveArmies_DoorSpelerDieNietHoeftTeKiezen_IsOngeldig()
    {
        var result = AttritionGuards.CanRemoveArmies(WachtOpP1(), "p2", new Dictionary<string, int> { ["alaska"] = 2 });

        Assert.Equal("attrition.notAwaitingPlayer", Assert.Single(result.Errors).Code);
    }

    [Fact]
    public void RemoveArmies_MetJuisteVerdeling_IsGeldig()
    {
        var result = AttritionGuards.CanRemoveArmies(
            WachtOpP1(), "p1", new Dictionary<string, int> { ["alaska"] = 1, ["alberta"] = 1 });

        Assert.True(result.IsSuccess);
    }

    /// <summary>Een negatief aantal zou een tekort elders in de som kunnen verbergen.</summary>
    [Fact]
    public void RemoveArmies_MetNegatiefAantal_IsOngeldigOokAlsDeSomKlopt()
    {
        var result = AttritionGuards.CanRemoveArmies(
            WachtOpP1(), "p1", new Dictionary<string, int> { ["alaska"] = 3, ["alberta"] = -1 });

        Assert.Equal("attrition.removalMustBePositive", Assert.Single(result.Errors).Code);
    }
}
