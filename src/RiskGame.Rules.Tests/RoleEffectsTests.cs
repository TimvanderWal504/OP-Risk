using RiskGame.Rules.Roles;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class RoleEffectsTests
{
    [Fact]
    public void Active_MetRolEnHerkomstlandInBezit_LevertHetEffectOp()
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "president"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, settings: settings)
            .WithTerritory(new TerritoryOwnership("eastern-united-states", "p1", 1));

        var effect = RoleEffects.Active<ExtraReinforcementEffect>(state, "p1");

        Assert.NotNull(effect);
        Assert.Equal(1, effect.Amount);
    }

    [Fact]
    public void Active_ZonderHerkomstlandInBezit_LevertNullOp()
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "president"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, settings: settings)
            .WithTerritory(new TerritoryOwnership("eastern-united-states", "p2", 1));

        Assert.Null(RoleEffects.Active<ExtraReinforcementEffect>(state, "p1"));
    }

    [Fact]
    public void Active_MetRollenUit_LevertNullOpOokMetHerkomstlandInBezit()
    {
        var players = new[] { TestGame.Player("p1", "red", roleId: "president"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players)
            .WithTerritory(new TerritoryOwnership("eastern-united-states", "p1", 1));

        Assert.Null(RoleEffects.Active<ExtraReinforcementEffect>(state, "p1"));
    }

    [Fact]
    public void Active_ZonderRol_LevertNullOp()
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, settings: settings);

        Assert.Null(RoleEffects.Active<ExtraReinforcementEffect>(state, "p1"));
    }

    [Fact]
    public void Active_MetVerkeerdEffectType_LevertNullOp()
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "president"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, settings: settings)
            .WithTerritory(new TerritoryOwnership("eastern-united-states", "p1", 1));

        Assert.Null(RoleEffects.Active<CardTradeBonusEffect>(state, "p1"));
    }
}
