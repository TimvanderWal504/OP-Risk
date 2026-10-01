using RiskGame.Rules.AutoPass;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests;

/// <summary>
/// FO §9.2 (besluit gebruiker 2026-10-01): op een afgesloten gebied komen geen legers bij — niet bij
/// Versterken, niet uit de ≥6-inlegpool en niet bij de automatische beurt. De +2-bezitsbonus van
/// zo'n gebied gaat in de vrije pool; kan een speler nergens legers kwijt, dan vervalt zijn pool en
/// staat inleggen stil.
/// </summary>
public class AfgeslotenGebiedVersterkenTests
{
    private static ActiveEffect Lock(params string[] territoryIds) =>
        new(new TerritoryLockedEffect("aardbeving", EffectDuration.OneRound, territoryIds));

    private static Card Card(string id, string? territoryId, string symbol) => new(id, territoryId, symbol);

    private static GameState Reinforce(
        IReadOnlyList<ActiveEffect> effects, int armiesRemaining = 3, IReadOnlyList<Player>? players = null) =>
        TestGame.InProgress(players: players, turnPhase: TurnPhase.Reinforce, activeEffects: effects, armiesRemaining: armiesRemaining)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 2))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1))
            .WithTerritory(new TerritoryOwnership("kamchatka", "p2", 1));

    [Fact]
    public void Plaatsen_OpAfgeslotenEigenGebied_IsOngeldig()
    {
        var state = Reinforce([Lock("alaska")]);

        var result = ReinforceGuards.CanPlaceArmies(state, "p1", "alaska", amount: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("reinforce.territoryLocked", result.Errors.Single().Code);
        Assert.True(ReinforceGuards.CanPlaceArmies(state, "p1", "alberta", amount: 1).IsSuccess);
    }

    [Fact]
    public void Plaatsen_UitDeInlegpoolInAanvallen_OpAfgeslotenGebied_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack, activeEffects: [Lock("alaska")], armiesRemaining: 4)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 2))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var result = ReinforceGuards.CanPlaceArmies(state, "p1", "alaska", amount: 1);

        Assert.Equal("reinforce.territoryLocked", result.Errors.Single().Code);
    }

    [Fact]
    public void PlaceableTerritoryIds_LaatAfgeslotenGebiedenWeg()
    {
        var state = Reinforce([Lock("alaska", "kamchatka")]);

        Assert.Equal(["alberta"], ReinforceGuards.PlaceableTerritoryIds(state, "p1"));
    }

    [Fact]
    public void FaseAfsluiten_MetLegersOver_KanAlleenAlsAllesAfgeslotenIs()
    {
        var deelsDicht = Reinforce([Lock("alaska")]);
        var allesDicht = Reinforce([Lock("alaska", "alberta")]);

        Assert.Equal("turnFlow.armiesRemaining", TurnGuards.CanEndPhase(deelsDicht, "p1").Errors.Single().Code);
        Assert.True(TurnGuards.CanEndPhase(allesDicht, "p1").IsSuccess);
    }

    [Fact]
    public void VerplichteInleg_WordtOvergeslagen_AlsAllesAfgeslotenIs()
    {
        var hand = Enumerable.Range(0, 5).Select(i => Card($"c{i}", "alaska", "symbol-1")).ToArray();
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };

        Assert.True(ReinforceGuards.MustTradeInCards(Reinforce([Lock("alaska")], players: players), "p1"));
        Assert.False(ReinforceGuards.MustTradeInCards(Reinforce([Lock("alaska", "alberta")], players: players), "p1"));
    }

    [Fact]
    public void VrijwilligInleggen_IsOngeldig_AlsAllesAfgeslotenIs()
    {
        var hand = new[] { Card("c1", "kamchatka", "symbol-1"), Card("c2", "ural", "symbol-1"), Card("c3", "china", "symbol-1") };
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };
        var state = Reinforce([Lock("alaska", "alberta")], players: players);

        var result = ReinforceGuards.CanTradeInCards(state, "p1", ["c1", "c2", "c3"]);

        Assert.Equal("reinforce.noOpenTerritory", result.Errors.Single().Code);
    }

    [Fact]
    public void Inleg_BezitsbonusVanAfgeslotenGebied_GaatInDeVrijePool()
    {
        var state = Reinforce([Lock("alaska")]);
        var cards = new[] { Card("c1", "alaska", "symbol-1"), Card("c2", "alberta", "symbol-1"), Card("c3", "kamchatka", "symbol-1") };

        var outcome = CardTradeCalculator.Evaluate(state, "p1", cards);

        Assert.Equal([new TerritoryBonus("alberta", state.Map.SetRules.OwnedTerritoryBonus)], outcome.OwnedTerritoryBonuses);
        Assert.Equal(state.Map.SetRules.OwnedTerritoryBonus, outcome.PoolBonus);
    }

    [Fact]
    public void Terugdraai_RekentDePoolbonusMeeBijDeVolledigeOpbrengst()
    {
        var trade = new UnsettledTrade(["c1", "c2", "c3"], SetValue: 4, OwnedTerritoryBonuses: [], PreviousTradeValue: 4, PoolBonus: 2);
        var turnState = new TurnState("p1", TurnPhase.Reinforce, Timer: null, PendingCombat: null, PausedAttackTarget: null, ArmiesRemaining: 6)
        {
            UnsettledTrades = [trade],
        };

        Assert.Equal([trade], CardTradeReversal.Resolve(turnState));
        Assert.Empty(CardTradeReversal.Resolve(turnState with { ArmiesRemaining = 5 }));
    }

    [Fact]
    public void AutomatischeBeurt_SlaatAfgeslotenFrontgebiedOver_EnValtTerugOpEenOpenEigenGebied()
    {
        // alaska grenst aan kamchatka (p2) en is dicht; alberta grenst alleen aan eigen gebieden.
        var state = Reinforce([Lock("alaska")])
            .WithTerritory(new TerritoryOwnership("northwest-territory", "p1", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1))
            .WithTerritory(new TerritoryOwnership("western-united-states", "p1", 1));

        var placements = AutoPassPlanner.Placements(state, "p1", armies: 3);

        Assert.DoesNotContain(placements, placement => placement.TerritoryId == "alaska");
        Assert.Equal(3, placements.Sum(placement => placement.Amount));
    }

    [Fact]
    public void AutomatischeBeurt_ZonderOpenGebied_LaatDeLegersVervallen()
    {
        var state = Reinforce([Lock("alaska", "alberta")]);

        Assert.Empty(AutoPassPlanner.Placements(state, "p1", armies: 3));
    }
}
