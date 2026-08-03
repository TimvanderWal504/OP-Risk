using RiskGame.Rules.Map;
using RiskGame.Rules.Roles;
using RiskGame.Rules.Territories;

namespace RiskGame.Rules.Tests;

public class TerritoryAssignmentCalculatorTests
{
    private static Territory MapTerritory(string id) => new(id, id, "continent", new Coordinate(0, 0));

    private static RoleDefinition Role(string id, string originTerritoryId) =>
        new(id, id, originTerritoryId, new ExtraReinforcementEffect(1), "beschrijving");

    [Fact]
    public void Toewijzen_VerdeeltAlleGebiedenZonderDuplicatenOfGaten()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var territories = new[] { MapTerritory("t1"), MapTerritory("t2"), MapTerritory("t3"), MapTerritory("t4") };
        var random = new FixedRandomSource(0, 0, 0, 0);

        var assignments = TerritoryAssignmentCalculator.Assign(players, territories, [], random);

        Assert.Equal(4, assignments.Count);
        Assert.Equal(
            territories.Select(t => t.Id).ToHashSet(),
            assignments.Select(a => a.TerritoryId).ToHashSet());
    }

    [Fact]
    public void Toewijzen_MetOngelijkAantalGebieden_VerschiltMaximaalEenGebiedTussenSpelers()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var territories = new[] { MapTerritory("t1"), MapTerritory("t2"), MapTerritory("t3") };
        var random = new FixedRandomSource(0, 0, 0);

        var assignments = TerritoryAssignmentCalculator.Assign(players, territories, [], random);

        var counts = assignments.GroupBy(a => a.PlayerId).Select(g => g.Count()).ToArray();
        Assert.Equal(1, counts.Max() - counts.Min());
    }

    [Fact]
    public void Toewijzen_MetDezelfdeTrekkingenVolgorde_IsDeterministisch()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var territories = new[] { MapTerritory("t1"), MapTerritory("t2"), MapTerritory("t3"), MapTerritory("t4") };

        var eersteRonde = TerritoryAssignmentCalculator.Assign(
            players, territories, [], new FixedRandomSource(2, 1, 0, 0));
        var tweedeRonde = TerritoryAssignmentCalculator.Assign(
            players, territories, [], new FixedRandomSource(2, 1, 0, 0));

        Assert.Equal(eersteRonde, tweedeRonde);
    }

    /// <summary>
    /// FO §5.1 "Rolrestrictie bij verdeling": zolang er een alternatief gebied over is,
    /// krijgt een speler nooit zijn eigen rol-herkomstland. 4 gebieden/2 spelers laat altijd
    /// een alternatief over voor p1's tweede trekking, dus dit scenario mag nooit vastlopen
    /// op de uitzondering.
    /// </summary>
    [Fact]
    public void Toewijzen_MetAlternatiefBeschikbaar_KrijgtSpelerNooitZijnEigenRolHerkomstland()
    {
        var players = new[] { TestGame.Player("p1", "red", roleId: "r1"), TestGame.Player("p2", "blue") };
        var territories = new[] { MapTerritory("t1"), MapTerritory("t2"), MapTerritory("t3"), MapTerritory("t4") };
        var roles = new[] { Role("r1", "t1") };
        var random = new FixedRandomSource(0, 0, 0, 0);

        var assignments = TerritoryAssignmentCalculator.Assign(players, territories, roles, random);

        var p1Territories = assignments.Where(a => a.PlayerId == "p1").Select(a => a.TerritoryId);
        Assert.DoesNotContain("t1", p1Territories);
    }

    /// <summary>
    /// FO §5.1/§8: geen uitzondering, ook niet als het eigen rol-herkomstland het enige
    /// overgebleven gebied is — de calculator ruilt dan met een al toegewezen gebied van een
    /// andere speler in plaats van de restrictie te schenden. Bewust doorgerekend scenario
    /// (2 spelers, 3 gebieden, p1's herkomstland = t3): stap 0 (p1, remaining=[t1,t2,t3], t1
    /// uitgesloten) kiest eligible-index 1 (t2) via waarde 1; stap 1 (p2, remaining=[t1,t3],
    /// geen restrictie) kiest eligible-index 0 (t1) via waarde 0; stap 2 (p1, remaining=[t3],
    /// geen alternatief) ruilt t3 met p2's eerder toegewezen t1 in plaats van t3 aan p1 te
    /// geven.
    /// </summary>
    [Fact]
    public void Toewijzen_MetAlleenNogHetEigenHerkomstlandOver_RuiltInPlaatsVanDeRestrictieTeSchenden()
    {
        var players = new[] { TestGame.Player("p1", "red", roleId: "r1"), TestGame.Player("p2", "blue") };
        var territories = new[] { MapTerritory("t1"), MapTerritory("t2"), MapTerritory("t3") };
        var roles = new[] { Role("r1", "t3") };
        var random = new FixedRandomSource(1, 0, 0);

        var assignments = TerritoryAssignmentCalculator.Assign(players, territories, roles, random);

        Assert.DoesNotContain(("t3", "p1"), assignments);
        Assert.Contains(("t3", "p2"), assignments);
        Assert.Contains(("t1", "p1"), assignments);
        Assert.Equal(3, assignments.Count);
        Assert.Equal(
            territories.Select(t => t.Id).ToHashSet(),
            assignments.Select(a => a.TerritoryId).ToHashSet());
    }
}
