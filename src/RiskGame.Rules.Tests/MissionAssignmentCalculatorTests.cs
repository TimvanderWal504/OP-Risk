using RiskGame.Rules.Missions;

namespace RiskGame.Rules.Tests;

public class MissionAssignmentCalculatorTests
{
    private static TerritoryCountMission Fallback(string id, int minPlayers = 0) =>
        new(id, "Fallback", "beschrijving", RequiresOwnTurn: false, Count: 24) { MinPlayers = minPlayers };

    private static ConquerContinentsMission Category(string id, int minPlayers = 0) =>
        new(id, "Categorie", "beschrijving", RequiresOwnTurn: false, Continents: ["c1"], ExtraAnyContinent: false)
        { MinPlayers = minPlayers };

    private static EliminatePlayerMission Eliminate(string id, string targetColor) =>
        new(id, "Naam", "beschrijving", RequiresOwnTurn: false, targetColor);

    [Fact]
    public void Toewijzen_MetAanwezigeAndereSpelerAlsDoelwit_HoudtDeEliminatePlayerMissieAan()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var pool = new MissionDefinition[] { Eliminate("e", "blue"), Category("cc") };
        var random = new FixedRandomSource(0, 1);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal("e", assignment["p1"]);
    }

    [Fact]
    public void Toewijzen_MetEigenKleurAlsDoelwit_GeeftEenMissieUitDeFallbackCategorie()
    {
        var players = new[] { TestGame.Player("p1", "red") };
        var pool = new MissionDefinition[] { Eliminate("e", "red"), Category("cc") };
        var random = new FixedRandomSource(0, 0);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal("cc", assignment["p1"]);
    }

    [Fact]
    public void Toewijzen_MetAfwezigeDoelwitkleur_GeeftEenMissieUitDeFallbackCategorie()
    {
        var players = new[] { TestGame.Player("p1", "red") };
        var pool = new MissionDefinition[] { Eliminate("e", "green"), Category("cc") };
        var random = new FixedRandomSource(0, 0);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal("cc", assignment["p1"]);
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
    public void Toewijzen_MissieMetMinPlayersBovenSpelersaantal_WordtNooitGetrokken()
    {
        var players = new[]
        {
            TestGame.Player("p1", "red"), TestGame.Player("p2", "blue"), TestGame.Player("p3", "green"),
        };
        var pool = new MissionDefinition[] { Fallback("restricted", minPlayers: 4), Fallback("m1"), Fallback("m2"), Fallback("m3") };
        var random = new FixedRandomSource(0, 1, 2);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal(0, random.Remaining);
        Assert.DoesNotContain("restricted", assignment.Values);
    }

    [Fact]
    public void Toewijzen_MissieMetMinPlayersOpSpelersaantal_KanWordenGetrokken()
    {
        var players = new[]
        {
            TestGame.Player("p1", "red"), TestGame.Player("p2", "blue"),
            TestGame.Player("p3", "green"), TestGame.Player("p4", "yellow"),
        };
        var pool = new MissionDefinition[] { Fallback("restricted", minPlayers: 4), Fallback("m1"), Fallback("m2"), Fallback("m3") };
        var random = new FixedRandomSource(0, 1, 2, 3);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal(0, random.Remaining);
        Assert.Contains("restricted", assignment.Values);
    }

    // Kern van de bugfix: vóór de categorie-aanpak konden meerdere spelers via een vaste
    // fallbackMissionId op dezelfde missie uitkomen. Hier hebben alle drie spelers tegelijk
    // een fallback nodig (hun doelwitkleur doet niet mee) en de categorie heeft precies drie
    // leden — elke speler moet een ándere missie krijgen.
    [Fact]
    public void Toewijzen_MeerdereSpelersHebbenTegelijkEenFallbackNodig_KrijgenElkEenUniekeMissieUitDeCategorie()
    {
        var players = new[]
        {
            TestGame.Player("p1", "red"), TestGame.Player("p2", "blue"), TestGame.Player("p3", "green"),
        };
        var pool = new MissionDefinition[]
        {
            Eliminate("e1", "black"), Eliminate("e2", "white"), Eliminate("e3", "pink"),
            Category("c1"), Category("c2"), Category("c3"),
        };
        var random = new FixedRandomSource(0, 1, 2, 0, 0, 0);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal(3, assignment.Values.Distinct().Count());
        Assert.All(assignment.Values, id => Assert.Contains(id, new[] { "c1", "c2", "c3" }));
    }

    // Een categorielid kan ook gewoon rechtstreeks (niet via fallback) door een andere speler
    // getrokken zijn — die mag dan niet nogmaals als fallback worden uitgedeeld.
    [Fact]
    public void Toewijzen_CategorielidAlRechtstreeksGetrokkenDoorAndereSpeler_WordtNietOpnieuwAlsFallbackGekozen()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var pool = new MissionDefinition[] { Eliminate("e", "black"), Category("c1"), Category("c2") };
        var random = new FixedRandomSource(0, 1, 0);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal("c1", assignment["p2"]);
        Assert.Equal("c2", assignment["p1"]);
    }

    [Fact]
    public void Toewijzen_CategorielidMetMinPlayersBovenSpelersaantal_WordtNietAlsFallbackGekozen()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var pool = new MissionDefinition[]
        {
            Eliminate("e", "black"), Category("restricted", minPlayers: 4), Category("cc"), Fallback("m2"),
        };
        var random = new FixedRandomSource(0, 2, 0);

        var assignment = MissionAssignmentCalculator.Assign(players, pool, random);

        Assert.Equal("cc", assignment["p1"]);
        Assert.DoesNotContain("restricted", assignment.Values);
    }

    [Fact]
    public void Toewijzen_UitgeputteFallbackCategorie_GooitEenException()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var pool = new MissionDefinition[] { Eliminate("e1", "black"), Eliminate("e2", "white"), Category("c1") };
        var random = new FixedRandomSource(0, 1, 0);

        Assert.Throws<InvalidOperationException>(() => MissionAssignmentCalculator.Assign(players, pool, random));
    }

    [Fact]
    public void Herwijzen_DoelwitDoorAndereSpelerUitgeschakeld_GeeftDeFallbackMissieAanDeHouder()
    {
        var holder = TestGame.Player("p1", "red", mission: Eliminate("e", "blue"));
        var players = new[] { holder, TestGame.Player("p2", "blue"), TestGame.Player("p3", "green") };
        var pool = new MissionDefinition[] { Category("cc") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
            players, pool, "blue", "p3", new FixedRandomSource(0));

        Assert.Equal("cc", fallbacks["p1"]);
    }

    [Fact]
    public void Herwijzen_DoelwitDoorDeMissiehouderZelfUitgeschakeld_HoudtDeMissieAan()
    {
        var holder = TestGame.Player("p1", "red", mission: Eliminate("e", "blue"));
        var players = new[] { holder, TestGame.Player("p2", "blue") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
            players, [], "blue", "p1", new FixedRandomSource());

        Assert.Empty(fallbacks);
    }

    [Fact]
    public void Herwijzen_MissieOpEenAndereKleurOfEenAnderMissietype_BlijftBuitenBeschouwing()
    {
        var eliminateOther = TestGame.Player("p1", "red", mission: Eliminate("e", "green"));
        var nonEliminate = TestGame.Player("p2", "purple", mission: Fallback("m"));
        var players = new[] { eliminateOther, nonEliminate, TestGame.Player("p3", "blue") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
            players, [], "blue", "p3", new FixedRandomSource());

        Assert.Empty(fallbacks);
    }

    [Fact]
    public void Herwijzen_HouderIsZelfAlUitgeschakeld_LevertGeenHerwijzingOp()
    {
        var holder = TestGame.Player("p1", "red", isEliminated: true, mission: Eliminate("e", "blue"));
        var players = new[] { holder, TestGame.Player("p2", "blue"), TestGame.Player("p3", "green") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
            players, [], "blue", "p3", new FixedRandomSource());

        Assert.Empty(fallbacks);
    }

    [Fact]
    public void Herwijzen_CategorielidMetMinPlayersBovenSpelersaantalBijStart_WordtNietGekozen()
    {
        var holder = TestGame.Player("p1", "red", mission: Eliminate("e", "blue"));
        var players = new[] { holder, TestGame.Player("p2", "blue"), TestGame.Player("p3", "green") };
        var pool = new MissionDefinition[] { Category("restricted", minPlayers: 4), Category("cc") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
            players, pool, "blue", "p3", new FixedRandomSource(0));

        Assert.Equal("cc", fallbacks["p1"]);
    }

    [Fact]
    public void Herwijzen_CategorielidMetMinPlayersOpSpelersaantalBijStart_KanWordenGekozen()
    {
        var holder = TestGame.Player("p1", "red", mission: Eliminate("e", "blue"));
        var players = new[]
        {
            holder, TestGame.Player("p2", "blue"), TestGame.Player("p3", "green"), TestGame.Player("p4", "yellow"),
        };
        var pool = new MissionDefinition[] { Category("restricted", minPlayers: 4) };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
            players, pool, "blue", "p3", new FixedRandomSource(0));

        Assert.Equal("restricted", fallbacks["p1"]);
    }

    // Met de echte data houdt hoogstens één speler ooit een missie op een gegeven doelwitkleur
    // (elke kleur heeft precies één eliminate-missie), maar de methode zelf legt dat niet af —
    // deze test bewijst de dedup-garantie ook voor het (synthetische) geval van twee houders.
    [Fact]
    public void Herwijzen_MeerdereHoudersTegelijk_KrijgenElkEenUniekeMissieUitDeCategorie()
    {
        var holder1 = TestGame.Player("p1", "red", mission: Eliminate("e1", "blue"));
        var holder2 = TestGame.Player("p2", "purple", mission: Eliminate("e2", "blue"));
        var players = new[] { holder1, holder2, TestGame.Player("p3", "blue"), TestGame.Player("p4", "yellow") };
        var pool = new MissionDefinition[] { Category("c1"), Category("c2") };

        var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
            players, pool, "blue", "p4", new FixedRandomSource(0, 0));

        Assert.Equal(2, fallbacks.Count);
        Assert.NotEqual(fallbacks["p1"], fallbacks["p2"]);
    }
}
