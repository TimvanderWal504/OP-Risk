using RiskGame.Rules.Roles;

namespace RiskGame.Rules.Tests;

public class RoleAssignmentCalculatorTests
{
    private static RoleDefinition Role(string id) =>
        new(id, id, id + "-land", new ExtraReinforcementEffect(1), "beschrijving");

    [Fact]
    public void Toewijzen_MetEvenveelRollenAlsSpelers_KrijgtIedereenEenUniekeRolUitDePool()
    {
        var playerIds = new[] { "p1", "p2", "p3" };
        var pool = new[] { Role("r1"), Role("r2"), Role("r3") };
        var random = new FixedRandomSource(0, 1, 2);

        var assignment = RoleAssignmentCalculator.Assign(playerIds, pool, random);

        Assert.Equal(playerIds.ToHashSet(), assignment.Keys.ToHashSet());
        Assert.Equal(pool.Select(role => role.Id).ToHashSet(), assignment.Values.ToHashSet());
    }

    [Fact]
    public void Toewijzen_MetMeerRollenDanSpelers_KostPreciesEvenveelTrekkingenAlsSpelers()
    {
        var playerIds = new[] { "p1", "p2" };
        var pool = new[] { Role("r1"), Role("r2"), Role("r3") };
        var random = new FixedRandomSource(2, 1);

        var assignment = RoleAssignmentCalculator.Assign(playerIds, pool, random);

        Assert.Equal(0, random.Remaining);
        Assert.Equal(2, assignment.Count);
        Assert.Equal(2, assignment.Values.Distinct().Count());
        Assert.All(assignment.Values, roleId => Assert.Contains(pool, role => role.Id == roleId));
    }

    [Fact]
    public void Toewijzen_MetDezelfdeTrekkingenVolgorde_IsDeterministisch()
    {
        var playerIds = new[] { "p1", "p2" };
        var pool = new[] { Role("r1"), Role("r2"), Role("r3") };

        var eersteRonde = RoleAssignmentCalculator.Assign(playerIds, pool, new FixedRandomSource(2, 1));
        var tweedeRonde = RoleAssignmentCalculator.Assign(playerIds, pool, new FixedRandomSource(2, 1));

        Assert.Equal(eersteRonde, tweedeRonde);
    }
}
