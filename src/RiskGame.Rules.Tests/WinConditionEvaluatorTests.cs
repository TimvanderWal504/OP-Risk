using RiskGame.Rules.Missions;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class WinConditionEvaluatorTests
{
    private static GameState GiveAllTerritoriesTo(GameState state, string playerId)
    {
        foreach (var territory in state.Map.Territories)
        {
            state = state.WithTerritory(new TerritoryOwnership(territory.Id, playerId, ArmyCount: 1));
        }

        return state;
    }

    [Fact]
    public void HasWorldDomination_MetAlleGebiedenInBezit_IsWaar()
    {
        var state = GiveAllTerritoriesTo(TestGame.InProgress(), "p1");

        Assert.True(WinConditionEvaluator.HasWorldDomination(state, "p1"));
    }

    [Fact]
    public void HasWorldDomination_MetEenOnverdeeldGebied_IsOnwaar()
    {
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        Assert.False(WinConditionEvaluator.HasWorldDomination(state, "p1"));
    }

    [Fact]
    public void Winners_BijWereldheerschappij_WintOngeachtDeIngesteldeWinconditie()
    {
        var state = GiveAllTerritoriesTo(
            TestGame.InProgress(settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions }),
            "p1");

        var winners = WinConditionEvaluator.Winners(state, turnEndedByPlayerId: "p1");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void Winners_BijWereldheerschappijAlsWinconditie_MetVolledigeKaart_WintDeEigenaar()
    {
        var state = GiveAllTerritoriesTo(TestGame.InProgress(), "p1");

        var winners = WinConditionEvaluator.Winners(state, turnEndedByPlayerId: "p1");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void Winners_MetBehaaldeMissieVanEenAndereSpelerDanDeBeurtbeeindiger_TeltMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.Winners(state, turnEndedByPlayerId: "p2");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void Winners_MetRequiresOwnTurnBuitenDeEigenBeurt_TeltNietMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: true, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.Winners(state, turnEndedByPlayerId: "p2");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void Winners_MetRequiresOwnTurnAanHetEindeVanDeEigenBeurt_TeltMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: true, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.Winners(state, turnEndedByPlayerId: "p1");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void Winners_BijWinconditieWereldheerschappij_TeltEenGeheimeMissieNietMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.WorldDomination })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.Winners(state, turnEndedByPlayerId: "p1");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void Winners_EenUitgeschakeldeSpeler_TeltNooitMee()
    {
        var state = GiveAllTerritoriesTo(
            TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", isEliminated: true),
                    TestGame.Player("p2", "blue"),
                ]),
            "p1");

        var winners = WinConditionEvaluator.Winners(state, turnEndedByPlayerId: "p2");

        Assert.DoesNotContain("p1", winners);
    }
}
