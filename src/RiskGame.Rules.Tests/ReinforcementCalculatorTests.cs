using RiskGame.Rules.Effects;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class ReinforcementCalculatorTests
{
    private static readonly string[] AustraliaTerritories =
        ["indonesia", "new-guinea", "western-australia", "eastern-australia", "new-zealand"];

    [Fact]
    public void MinderDanNegenGebieden_LevertMinimumVanDrieOp()
    {
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 2));

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        Assert.Equal(3, armies);
    }

    [Fact]
    public void TwaalfGebieden_LevertGebiedenGedeeldDoorDrieOp()
    {
        // Acht van de negen Noord-Amerika-gebieden en vier van de twaalf Azië-gebieden,
        // bewust geen enkel continent compleet, om alleen de basisformule te testen.
        string[] territoryIds =
        [
            "alaska", "northwest-territory", "greenland", "alberta",
            "ontario", "quebec", "western-united-states", "eastern-united-states",
            "ural", "siberia", "yakutsk", "irkutsk",
        ];

        var state = TestGame.InProgress();

        foreach (var territoryId in territoryIds)
        {
            state = state.WithTerritory(new TerritoryOwnership(territoryId, "p1", 1));
        }

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        Assert.Equal(4, armies);
    }

    [Fact]
    public void VolledigBezitVanEenContinent_GeeftContinentbonus()
    {
        var state = TestGame.InProgress();

        foreach (var territoryId in AustraliaTerritories)
        {
            state = state.WithTerritory(new TerritoryOwnership(territoryId, "p1", 1));
        }

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        // Basis 3 (5 gebieden < 9) + Australië-bonus 3.
        Assert.Equal(6, armies);
    }

    [Fact]
    public void GedeeltelijkBezitVanEenContinent_GeeftGeenContinentbonus()
    {
        var state = TestGame.InProgress();

        foreach (var territoryId in AustraliaTerritories.Take(AustraliaTerritories.Length - 1))
        {
            state = state.WithTerritory(new TerritoryOwnership(territoryId, "p1", 1));
        }

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        Assert.Equal(3, armies);
    }

    [Fact]
    public void RolBonus_MetRollenAanEnHerkomstlandInBezit_TeltMee()
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "president"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, settings: settings)
            .WithTerritory(new TerritoryOwnership("eastern-united-states", "p1", 1));

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        Assert.Equal(4, armies);
    }

    [Fact]
    public void RolBonus_ZonderHerkomstlandInBezit_TeltNietMee()
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "president"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, settings: settings)
            .WithTerritory(new TerritoryOwnership("eastern-united-states", "p2", 1));

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        Assert.Equal(3, armies);
    }

    [Fact]
    public void RolBonus_MetRollenUit_TeltNietMeeOokNietBijBezit()
    {
        var players = new[] { TestGame.Player("p1", "red", roleId: "president"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players)
            .WithTerritory(new TerritoryOwnership("eastern-united-states", "p1", 1));

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        Assert.Equal(3, armies);
    }

    [Fact]
    public void ContinentOwnerBonusEffect_MetVolledigContinentbezit_TeltMee()
    {
        var effect = new ActiveEffect(
            new ContinentOwnerBonusEffect("goede-oogst", EffectDuration.Instant, Amount: 2), RoundsRemaining: 0);

        var state = TestGame.InProgress(activeEffects: [effect]);

        foreach (var territoryId in AustraliaTerritories)
        {
            state = state.WithTerritory(new TerritoryOwnership(territoryId, "p1", 1));
        }

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        // Basis 3 + continentbonus 3 + ContinentOwnerBonus-event 2.
        Assert.Equal(8, armies);
    }

    [Fact]
    public void ContinentOwnerBonusEffect_ZonderVolledigContinentbezit_TeltNietMee()
    {
        var effect = new ActiveEffect(
            new ContinentOwnerBonusEffect("goede-oogst", EffectDuration.Instant, Amount: 2), RoundsRemaining: 0);

        var state = TestGame.InProgress(activeEffects: [effect])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3));

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        Assert.Equal(3, armies);
    }

    [Fact]
    public void FreeReinforcementEffect_TeltAltijdMee()
    {
        var effect = new ActiveEffect(
            new FreeReinforcementEffect("gratis-legers", EffectDuration.Instant, Amount: 4), RoundsRemaining: 0);

        var state = TestGame.InProgress(activeEffects: [effect])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3));

        var armies = ReinforcementCalculator.CalculateArmies(state, "p1");

        Assert.Equal(7, armies);
    }
}
