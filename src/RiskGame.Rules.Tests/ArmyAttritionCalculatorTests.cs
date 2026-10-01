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

    /// <summary>FO §9.2: bij precies genoeg is er maar één uitkomst, maar de speler kiest toch zelf.</summary>
    [Fact]
    public void HasChoice_MetPreciesGenoegAfstaanbareLegers_IsWaar()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 3, albertaArmies: 2);

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

        // Alaska staat 2 legers af en houdt er 1; Alberta heeft niets af te staan.
        Assert.Equal(new Dictionary<string, int> { ["alaska"] = 2 }, removals);
        Assert.Equal(ArmyAttritionCalculator.MaxRemovableArmies(state, "p1"), removals.Values.Sum());
    }

    /// <summary>FO §9.2/§11.2: telkens 1 van de grootste stapel, bij gelijkstand het eerste gebied in de kaartdata.</summary>
    [Fact]
    public void AutoPassRemovals_HaaltTelkensEenLegerVanDeGrootsteStapel()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 4, albertaArmies: 4);

        var removals = ArmyAttritionCalculator.AutoPassRemovals(state, "p1", amount: 3);

        // 4/4 → Alaska (gelijk, eerst in de kaartdata); 3/4 → Alberta; 3/3 → Alaska.
        Assert.Equal(new Dictionary<string, int> { ["alaska"] = 2, ["alberta"] = 1 }, removals);
        Assert.True(ArmyAttritionCalculator.CanApply(state, "p1", removals, amount: 3).IsSuccess);
    }

    [Fact]
    public void AutoPassRemovals_MetTeWeinigAfstaanbareLegers_IsHetAutomatischeMaximum()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 2, albertaArmies: 1);

        var removals = ArmyAttritionCalculator.AutoPassRemovals(state, "p1", amount: 3);

        Assert.Equal(ArmyAttritionCalculator.AutoMaxRemovals(state, "p1"), removals);
    }

    [Fact]
    public void AutoPassRemovals_MetNegatiefAantal_IsEenBugInDeAanroeper()
    {
        var state = TweeGebiedenVoorP1(alaskaArmies: 4, albertaArmies: 4);

        Assert.Throws<ArgumentOutOfRangeException>(() => ArmyAttritionCalculator.AutoPassRemovals(state, "p1", amount: -1));
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
        Assert.Equal("attrition.territoryMustKeepOneArmy", result.Errors.Single().Code);
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
        Assert.Equal("common.territoryNotOwned", result.Errors.Single().Code);
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
