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
    public void DirectWinners_BijWereldheerschappij_WintOngeachtDeIngesteldeWinconditie()
    {
        var state = GiveAllTerritoriesTo(
            TestGame.InProgress(settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions }),
            "p1");

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p1");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void DirectWinners_BijWereldheerschappijAlsWinconditie_MetVolledigeKaart_WintDeEigenaar()
    {
        var state = GiveAllTerritoriesTo(TestGame.InProgress(), "p1");

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p1");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void DirectWinners_MetBehaaldeBezitMissieOnderEndOfTurn_TeltMeteenMee()
    {
        // MissionWinTiming.EndOfTurn (standaard, niet expliciet gezet) laat DirectWinners ook
        // bezit-missies meteen meepakken — er is dan nooit een laatste-kans-venster (FO §6.2).
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p2");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void DirectWinners_MetBehaaldeBezitMissieOnderStartOfNextTurn_TeltNietMeteenMee()
    {
        // Onder de laatste-kans-instellingen claimt LastChanceEligibleWinners deze missie
        // in plaats van DirectWinners (zie de tests daarvoor hieronder).
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with
                {
                    WinCondition = WinCondition.SecretMissions,
                    MissionWinTiming = MissionWinTiming.StartOfNextTurn,
                })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p2");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void DirectWinners_MetVervuldeEliminatePlayerMissie_TeltMeteenMeeOngeachtTiming()
    {
        // EliminatePlayer is onomkeerbaar (FO §6.2) — blijft direct, zelfs onder een
        // laatste-kans-instelling.
        var mission = new EliminatePlayerMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, TargetColor: "blue", FallbackMissionId: "fallback");
        var state = TestGame.InProgress(
            [
                TestGame.Player("p1", "red", mission: mission),
                TestGame.Player("p2", "blue", isEliminated: true, eliminatedByPlayerId: "p1"),
            ],
            settings: TestGame.Settings() with
            {
                WinCondition = WinCondition.SecretMissions,
                MissionWinTiming = MissionWinTiming.FullRoundRevealed,
            });

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p1");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void DirectWinners_MetRequiresOwnTurnBuitenDeEigenBeurt_TeltNietMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: true, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p2");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void DirectWinners_MetRequiresOwnTurnAanHetEindeVanDeEigenBeurt_TeltMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: true, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p1");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void DirectWinners_BijWinconditieWereldheerschappij_TeltEenGeheimeMissieNietMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.WorldDomination })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p1");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void DirectWinners_EenUitgeschakeldeSpeler_TeltNooitMee()
    {
        var state = GiveAllTerritoriesTo(
            TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", isEliminated: true),
                    TestGame.Player("p2", "blue"),
                ]),
            "p1");

        var winners = WinConditionEvaluator.DirectWinners(state, turnEndedByPlayerId: "p2");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void LastChanceEligibleWinners_OnderEndOfTurn_IsAltijdLeeg()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.LastChanceEligibleWinners(state, turnEndedByPlayerId: "p2");

        Assert.Empty(winners);
    }

    [Fact]
    public void LastChanceEligibleWinners_MetBehaaldeMissieVanEenAndereSpelerDanDeBeurtbeeindiger_TeltMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with
                {
                    WinCondition = WinCondition.SecretMissions,
                    MissionWinTiming = MissionWinTiming.StartOfNextTurn,
                })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.LastChanceEligibleWinners(state, turnEndedByPlayerId: "p2");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void LastChanceEligibleWinners_MetRequiresOwnTurnBuitenDeEigenBeurt_TeltNietMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: true, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with
                {
                    WinCondition = WinCondition.SecretMissions,
                    MissionWinTiming = MissionWinTiming.StartOfNextTurn,
                })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.LastChanceEligibleWinners(state, turnEndedByPlayerId: "p2");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void LastChanceEligibleWinners_MetRequiresOwnTurnAanHetEindeVanDeEigenBeurt_TeltMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: true, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with
                {
                    WinCondition = WinCondition.SecretMissions,
                    MissionWinTiming = MissionWinTiming.StartOfNextTurn,
                })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.LastChanceEligibleWinners(state, turnEndedByPlayerId: "p1");

        Assert.Contains("p1", winners);
    }

    [Fact]
    public void LastChanceEligibleWinners_BijWinconditieWereldheerschappij_TeltEenGeheimeMissieNietMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with
                {
                    WinCondition = WinCondition.WorldDomination,
                    MissionWinTiming = MissionWinTiming.StartOfNextTurn,
                })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.LastChanceEligibleWinners(state, turnEndedByPlayerId: "p1");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void LastChanceEligibleWinners_EenUitgeschakeldeSpeler_TeltNooitMee()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission, isEliminated: true),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with
                {
                    WinCondition = WinCondition.SecretMissions,
                    MissionWinTiming = MissionWinTiming.StartOfNextTurn,
                })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var winners = WinConditionEvaluator.LastChanceEligibleWinners(state, turnEndedByPlayerId: "p2");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void LastChanceEligibleWinners_MetVervuldeEliminatePlayerMissie_TeltNietMee()
    {
        var mission = new EliminatePlayerMission(
            "m", "Naam", "Beschrijving", RequiresOwnTurn: false, TargetColor: "blue", FallbackMissionId: "fallback");
        var state = TestGame.InProgress(
            [
                TestGame.Player("p1", "red", mission: mission),
                TestGame.Player("p2", "blue", isEliminated: true, eliminatedByPlayerId: "p1"),
            ],
            settings: TestGame.Settings() with
            {
                WinCondition = WinCondition.SecretMissions,
                MissionWinTiming = MissionWinTiming.StartOfNextTurn,
            });

        var winners = WinConditionEvaluator.LastChanceEligibleWinners(state, turnEndedByPlayerId: "p1");

        Assert.DoesNotContain("p1", winners);
    }

    [Fact]
    public void StillHoldsLastChanceMission_MetNogVervuldeMissie_IsWaar()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        Assert.True(WinConditionEvaluator.StillHoldsLastChanceMission(state, "p1"));
    }

    [Fact]
    public void StillHoldsLastChanceMission_MetHeroverdGebied_IsOnwaar()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
            [
                TestGame.Player("p1", "red", mission: mission),
                TestGame.Player("p2", "blue"),
            ],
            settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions });

        // p1 bezit hier geen enkel gebied (meer) — de missie ("bezit 1 gebied") is heroverd.
        Assert.False(WinConditionEvaluator.StillHoldsLastChanceMission(state, "p1"));
    }

    [Fact]
    public void StillHoldsLastChanceMission_MetUitgeschakeldeMissiehouder_IsOnwaar()
    {
        var mission = new TerritoryCountMission("m", "Naam", "Beschrijving", RequiresOwnTurn: false, Count: 1);
        var state = TestGame.InProgress(
                [
                    TestGame.Player("p1", "red", mission: mission, isEliminated: true, eliminatedByPlayerId: "p2"),
                    TestGame.Player("p2", "blue"),
                ],
                settings: TestGame.Settings() with { WinCondition = WinCondition.SecretMissions })
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        Assert.False(WinConditionEvaluator.StillHoldsLastChanceMission(state, "p1"));
    }
}
