using RiskGame.Rules.Roles;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests;

/// <summary>FO §10: bij Dobbelregel = Klassiek vallen de DefenseBoost-rollen uit de rolpool.</summary>
public class RolePoolTests
{
    private static readonly string[] DefenseBoostRoleIds = ["capoeirista", "pendekar", "berserker"];

    private static GameState Lobby(DefenseDiceRule rule, int playerCount = 2)
    {
        var colors = new[] { "red", "blue", "green", "yellow", "purple", "orange", "black" };
        var players = Enumerable.Range(1, playerCount)
            .Select(index => TestGame.Player($"p{index}", colors[index - 1]))
            .ToArray();

        var settings = TestGame.Settings() with
        {
            RolesEnabled = true,
            RoleAssignment = RoleAssignmentMode.Choose,
            DefenseDiceRule = rule,
        };

        return TestGame.InProgress(players: players, settings: settings).WithPhase(GamePhase.Lobby);
    }

    [Fact]
    public void Rolcatalogus_BevatDeDrieDefenseBoostRollen()
    {
        var roles = Standaard43Data.Load().Roles;

        foreach (var roleId in DefenseBoostRoleIds)
        {
            Assert.IsType<DefenseBoostEffect>(roles.Single(role => role.Id == roleId).Effect);
        }
    }

    [Fact]
    public void Rolpool_BijHuisregel_BevatAlleRollen()
    {
        var state = Lobby(DefenseDiceRule.HouseRule);

        var pool = RolePool.EffectiveRoles(state);

        Assert.Equal(state.Map.Roles.Count, pool.Count);
        Assert.All(DefenseBoostRoleIds, roleId => Assert.Contains(pool, role => role.Id == roleId));
    }

    [Fact]
    public void Rolpool_BijKlassiek_LaatDeDefenseBoostRollenWeg()
    {
        var state = Lobby(DefenseDiceRule.Classic);

        var pool = RolePool.EffectiveRoles(state);

        Assert.Equal(state.Map.Roles.Count - DefenseBoostRoleIds.Length, pool.Count);
        Assert.DoesNotContain(pool, role => role.Effect is DefenseBoostEffect);
    }

    [Fact]
    public void Rolkeuze_DefenseBoostRolBijKlassiek_IsOngeldig()
    {
        var state = Lobby(DefenseDiceRule.Classic);

        var result = LobbyGuards.RoleIsKnown(state, "capoeirista");

        Assert.False(result.IsSuccess);
        Assert.Equal("lobby.unknownRole", result.Errors.Single().Code);
    }

    [Fact]
    public void Rolkeuze_DefenseBoostRolBijHuisregel_IsGeldig()
    {
        var state = Lobby(DefenseDiceRule.HouseRule);

        Assert.True(LobbyGuards.RoleIsKnown(state, "capoeirista").IsSuccess);
    }

    [Fact]
    public void RolpoolGrootte_BijKlassiekMetZevenSpelers_IsGrootGenoeg()
    {
        var state = Lobby(DefenseDiceRule.Classic, playerCount: 7);

        Assert.True(LobbyGuards.RolePoolIsLargeEnough(state).IsSuccess);
    }
}
