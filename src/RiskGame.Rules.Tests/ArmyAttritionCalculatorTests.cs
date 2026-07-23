using RiskGame.Rules.Effects;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class ArmyAttritionCalculatorTests
{
    private static GameState TweeGebiedenVoorP1(int alaskaArmies, int albertaArmies) =>
        TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("alaska", "p1", alaskaArmies))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", albertaArmies));

    [Fact]
    public void MaxRemovableArmies_TeltLegersMinEenPerGebiedOp()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 4, albertaArmies: 2);

        var max = ArmyAttritionCalculator.MaxRemovableArmies(state, "p1");

        Assert.Equal(4, max);
    }

    [Fact]
    public void HasChoice_MetGenoegAfstaanbareLegers_IsWaar()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 4, albertaArmies: 2);

        Assert.True(ArmyAttritionCalculator.HasChoice(state, "p1", amount: 3));
    }

    [Fact]
    public void HasChoice_MetTeWeinigAfstaanbareLegers_IsOnwaar()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 2, albertaArmies: 1);

        Assert.False(ArmyAttritionCalculator.HasChoice(state, "p1", amount: 3));
    }

    [Fact]
    public void AutoMaxRemovals_BrengtElkGebiedTerugNaarEenLeger()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 3, albertaArmies: 1);

        var removals = ArmyAttritionCalculator.AutoMaxRemovals(state, "p1");

        Assert.Equal(new Dictionary<string, int> { ["alaska"] = 1 }, removals);
    }

    [Fact]
    public void CanApply_MetJuisteVerdeling_IsGeldig()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 4, albertaArmies: 2);

        var result = ArmyAttritionCalculator.CanApply(
            state, "p1", new Dictionary<string, int> { ["alaska"] = 2, ["alberta"] = 1 }, amount: 3);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void CanApply_MetTeWeinigVerwijderd_IsOngeldig()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 4, albertaArmies: 2);

        var result = ArmyAttritionCalculator.CanApply(
            state, "p1", new Dictionary<string, int> { ["alaska"] = 1 }, amount: 3);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void CanApply_MetGebiedOnderEenLeger_IsOngeldig()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 4, albertaArmies: 2);

        var result = ArmyAttritionCalculator.CanApply(
            state, "p1", new Dictionary<string, int> { ["alaska"] = 4 }, amount: 4);

        Assert.False(result.IsSuccess);
        Assert.Contains("mag niet onder 1 leger komen", result.Errors.Single());
    }

    [Fact]
    public void CanApply_MetGebiedVanAndereSpeler_IsOngeldig()
    {
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 3));

        var result = ArmyAttritionCalculator.CanApply(
            state, "p1", new Dictionary<string, int> { ["alberta"] = 1 }, amount: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("geen gebied van speler", result.Errors.Single());
    }

    [Fact]
    public void CanApply_MetMeerDanBeschikbaarMaximum_BeperktTotHetMaximum()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 2, albertaArmies: 1);

        var result = ArmyAttritionCalculator.CanApply(
            state, "p1", new Dictionary<string, int> { ["alaska"] = 1 }, amount: 5);

        Assert.True(result.IsSuccess);
    }
}
