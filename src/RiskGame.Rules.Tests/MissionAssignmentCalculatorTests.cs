using RiskGame.Rules.Missions;

namespace RiskGame.Rules.Tests;

public class MissionAssignmentCalculatorTests
{
    private static TerritoryCountMission Fallback(string id) =>
        new(id, "Fallback", "beschrijving", RequiresOwnTurn: false, Count: 24);

    private static EliminatePlayerMission Eliminate(string id, string targetColor, string fallbackId) =>
        new(id, "Naam", "beschrijving", RequiresOwnTurn: false, targetColor, fallbackId);

    [Fact]
    public void Toewijzen_MetAanwezigeAndereSpelerAlsDoelwit_HoudtDeEliminatePlayerMissieAan()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var pool = new MissionDefinition[] { Eliminate("e", "blue", "fb"), Fallback("fb") };
        var random = new FixedRandomSource(0, 1);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal("e", assignment["p1"]);
    }

    [Fact]
    public void Toewijzen_MetEigenKleurAlsDoelwit_GeeftDeFallbackMissie()
    {
        var players = new[] { TestGame.Player("p1", "red") };
        var pool = new MissionDefinition[] { Eliminate("e", "red", "fb") };
        var random = new FixedRandomSource(0);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal("fb", assignment["p1"]);
    }

    [Fact]
    public void Toewijzen_MetAfwezigeDoelwitkleur_GeeftDeFallbackMissie()
    {
        var players = new[] { TestGame.Player("p1", "red") };
        var pool = new MissionDefinition[] { Eliminate("e", "green", "fb") };
        var random = new FixedRandomSource(0);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal("fb", assignment["p1"]);
    }

    [Fact]
    public void Toewijzen_ZonderEliminatePlayerMissies_KrijgtIedereenEenUniekeMissieUitDePool()
    {
        var players = new[]
        {
            TestGame.Player("p1", "red"), TestGame.Player("p2", "blue"), TestGame.Player("p3", "green"),
        };
        var pool = new MissionDefinition[] { Fallback("m1"), Fallback("m2"), Fallback("m3") };
        var random = new FixedRandomSource(0, 1, 2);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal(0, random.Remaining);
        Assert.Equal(pool.Select(mission => mission.Id).ToHashSet(), assignment.Values.ToHashSet());
    }

    [Fact]
    public void Herwijzen_DoelwitDoorAndereSpelerUitgeschakeld_GeeftDeFallbackMissieAanDeHouder()
    {
        var holder = TestGame.Player("p1", "red", mission: Eliminate("e", "blue", "fb"));
        var players = new[] { holder, TestGame.Player("p2", "blue"), TestGame.Player("p3", "green") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(players, "blue", "p3");

        Assert.Equal("fb", fallbacks["p1"]);
    }

    [Fact]
    public void Herwijzen_DoelwitDoorDeMissiehouderZelfUitgeschakeld_HoudtDeMissieAan()
    {
        var holder = TestGame.Player("p1", "red", mission: Eliminate("e", "blue", "fb"));
        var players = new[] { holder, TestGame.Player("p2", "blue") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(players, "blue", "p1");

        Assert.Empty(fallbacks);
    }

    [Fact]
    public void Herwijzen_MissieOpEenAndereKleurOfEenAnderMissietype_BlijftBuitenBeschouwing()
    {
        var eliminateOther = TestGame.Player("p1", "red", mission: Eliminate("e", "green", "fb"));
        var nonEliminate = TestGame.Player("p2", "purple", mission: Fallback("m"));
        var players = new[] { eliminateOther, nonEliminate, TestGame.Player("p3", "blue") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(players, "blue", "p3");

        Assert.Empty(fallbacks);
    }

    [Fact]
    public void Herwijzen_HouderIsZelfAlUitgeschakeld_LevertGeenHerwijzingOp()
    {
        var holder = TestGame.Player("p1", "red", isEliminated: true, mission: Eliminate("e", "blue", "fb"));
        var players = new[] { holder, TestGame.Player("p2", "blue"), TestGame.Player("p3", "green") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(players, "blue", "p3");

        Assert.Empty(fallbacks);
    }
}
