using RiskGame.Rules.Missions;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class MissionDefinitionTests
{
    private static readonly string[] SouthAmerica = ["venezuela", "peru", "brazil", "argentina"];
    private static readonly string[] Australia =
        ["indonesia", "new-guinea", "western-australia", "eastern-australia", "new-zealand"];

    private static GameState WithTerritoriesOwnedBy(GameState state, string playerId, IEnumerable<string> territoryIds)
    {
        foreach (var territoryId in territoryIds)
        {
            state = state.WithTerritory(new TerritoryOwnership(territoryId, playerId, ArmyCount: 1));
        }

        return state;
    }

    [Fact]
    public void TerritoryCount_MetGenoegGebieden_IsBehaald()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 2);
        var state = WithTerritoriesOwnedBy(TestGame.InProgress(), "p1", ["alaska", "alberta"]);

        Assert.True(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void TerritoryCount_MetTeWeinigGebieden_IsNietBehaald()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 2);
        var state = WithTerritoriesOwnedBy(TestGame.InProgress(), "p1", ["alaska"]);

        Assert.False(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void TerritoryCountMinArmies_MetGenoegZwareGebieden_IsBehaald()
    {
        var mission = new TerritoryCountMinArmiesMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 2, MinArmies: 3);
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 3))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1));

        Assert.True(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void TerritoryCountMinArmies_GebiedenOnderDeDrempelTellenNietMee()
    {
        var mission = new TerritoryCountMinArmiesMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 2, MinArmies: 3);
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 2));

        Assert.False(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void ConquerContinents_MetAlleGenoemdeContinenten_IsBehaald()
    {
        var mission = new ConquerContinentsMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, ["south-america"], ExtraAnyContinent: false);
        var state = WithTerritoriesOwnedBy(TestGame.InProgress(), "p1", SouthAmerica);

        Assert.True(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void ConquerContinents_MetEenGebiedVanHetContinentNietInBezit_IsNietBehaald()
    {
        var mission = new ConquerContinentsMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, ["south-america"], ExtraAnyContinent: false);
        var state = WithTerritoriesOwnedBy(TestGame.InProgress(), "p1", SouthAmerica.Take(3));

        Assert.False(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void ConquerContinents_MetExtraAnyContinentMaarZonderExtraContinent_IsNietBehaald()
    {
        var mission = new ConquerContinentsMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, ["south-america"], ExtraAnyContinent: true);
        var state = WithTerritoriesOwnedBy(TestGame.InProgress(), "p1", SouthAmerica);

        Assert.False(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void ConquerContinents_MetExtraAnyContinentEnEenExtraContinent_IsBehaald()
    {
        var mission = new ConquerContinentsMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, ["south-america"], ExtraAnyContinent: true);
        var state = WithTerritoriesOwnedBy(
            TestGame.InProgress(), "p1", SouthAmerica.Concat(Australia));

        Assert.True(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void EliminatePlayer_MetDoorMissiehouderUitgeschakeldDoelwit_IsBehaald()
    {
        var mission = new EliminatePlayerMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, TargetColor: "blue", FallbackMissionId: "f");
        var state = TestGame.InProgress(
            [
                TestGame.Player("p1", "red"),
                TestGame.Player("p2", "blue", isEliminated: true, eliminatedByPlayerId: "p1"),
            ]);

        Assert.True(mission.IsAchieved(state, "p1"));
    }

    /// <summary>
    /// FO §6.1: schakelt een ándere speler het doelwit uit, dan telt de missie niet — de
    /// missiehouder krijgt in plaats daarvan (in een latere bouwstap) automatisch zijn
    /// fallback-missie toegewezen.
    /// </summary>
    [Fact]
    public void EliminatePlayer_MetDoorEenAndereSpelerUitgeschakeldDoelwit_IsNietBehaald()
    {
        var mission = new EliminatePlayerMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, TargetColor: "blue", FallbackMissionId: "f");
        var state = TestGame.InProgress(
            [
                TestGame.Player("p1", "red"),
                TestGame.Player("p2", "blue", isEliminated: true, eliminatedByPlayerId: "p3"),
                TestGame.Player("p3", "yellow"),
            ]);

        Assert.False(mission.IsAchieved(state, "p1"));
    }

    [Fact]
    public void EliminatePlayer_MetNogActiefDoelwit_IsNietBehaald()
    {
        var mission = new EliminatePlayerMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, TargetColor: "blue", FallbackMissionId: "f");
        var state = TestGame.InProgress(
            [TestGame.Player("p1", "red"), TestGame.Player("p2", "blue")]);

        Assert.False(mission.IsAchieved(state, "p1"));
    }
}
