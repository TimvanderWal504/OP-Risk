using RiskGame.Rules.Roles;

namespace RiskGame.Rules.Tests;

public class RoleOriginLookupTests
{
    private static RoleDefinition Role(string id) =>
        new(id, id, id + "-land", new ExtraReinforcementEffect(1), "beschrijving");

    [Fact]
    public void OriginTerritoryIdOf_ZonderRol_IsNull()
    {
        var roles = new[] { Role("r1") };

        Assert.Null(RoleOriginLookup.OriginTerritoryIdOf(null, roles));
    }

    [Fact]
    public void OriginTerritoryIdOf_MetRol_GeeftHetHerkomstlandVanDieRol()
    {
        var roles = new[] { Role("r1"), Role("r2") };

        Assert.Equal("r2-land", RoleOriginLookup.OriginTerritoryIdOf("r2", roles));
    }
}
