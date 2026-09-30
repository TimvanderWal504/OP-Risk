using RiskGame.Rules.AutoPass;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class AutoPassPlannerTests
{
    private static readonly string[] NorthAmerica =
    [
        "alaska", "northwest-territory", "greenland", "alberta", "ontario", "quebec",
        "western-united-states", "eastern-united-states", "central-america",
    ];

    /// <summary>
    /// p1 bezit heel Noord-Amerika, p2 de rest. Frontgebieden van p1: Alaska (zee naar Kamtsjatka),
    /// Groenland (zee naar IJsland) en Midden-Amerika (land naar Venezuela).
    /// </summary>
    private static GameState NoordAmerikaVoorP1(
        IReadOnlyList<Card>? hand = null, IReadOnlyList<ActiveEffect>? activeEffects = null)
    {
        var state = TestGame.InProgress(
            players: [TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue")],
            activeEffects: activeEffects);

        foreach (var territory in state.Map.Territories)
        {
            var owner = NorthAmerica.Contains(territory.Id) ? "p1" : "p2";
            state = state.WithTerritory(new TerritoryOwnership(territory.Id, owner, ArmyCount: 1));
        }

        return state;
    }

    private static Card Card(string id, string? territoryId, string symbol) => new(id, territoryId, symbol);

    [Fact]
    public void Plaatsen_VerdeeltOmDeBeurtOverDeFrontgebiedenInDeVolgordeVanDeKaartdata()
    {
        var state = NoordAmerikaVoorP1();

        var placements = AutoPassPlanner.Placements(state, "p1", armies: 5);

        Assert.Equal(
            [new ArmyPlacement("alaska", 2), new ArmyPlacement("greenland", 2), new ArmyPlacement("central-america", 1)],
            placements);
    }

    [Fact]
    public void Plaatsen_EenGebiedZonderVijandelijkeBuur_KrijgtNiets()
    {
        var state = NoordAmerikaVoorP1();

        var placements = AutoPassPlanner.Placements(state, "p1", armies: 30);

        Assert.DoesNotContain(placements, placement => placement.TerritoryId == "alberta");
        Assert.Equal(30, placements.Sum(placement => placement.Amount));
    }

    /// <summary>FO §11.2: een tijdelijke zeeblokkade maakt Alaska en Groenland geen achterland.</summary>
    [Fact]
    public void Plaatsen_EenZeeblokkadeTeltNietMee()
    {
        var state = NoordAmerikaVoorP1(
            activeEffects: [new ActiveEffect(Standaard43Data.EventEffect("stormachtige-zeeen"))]);

        var placements = AutoPassPlanner.Placements(state, "p1", armies: 3);

        Assert.Equal(
            [new ArmyPlacement("alaska", 1), new ArmyPlacement("greenland", 1), new ArmyPlacement("central-america", 1)],
            placements);
    }

    /// <summary>TO §3.3: de gewone plaatsingsregel is een vangnet — na de inleg keurt die elke plaatsing goed.</summary>
    [Fact]
    public void Plaatsen_ElkePlaatsingIsToegestaanVolgensDeGewoneRegel()
    {
        var state = NoordAmerikaVoorP1();

        var placements = AutoPassPlanner.Placements(state, "p1", armies: 7);

        Assert.All(placements, placement =>
            Assert.True(ReinforceGuards.CanPlaceArmies(state, "p1", placement.TerritoryId, placement.Amount).IsSuccess));
    }

    [Fact]
    public void Plaatsen_ZonderLegers_IsLeeg()
    {
        var state = NoordAmerikaVoorP1();

        Assert.Empty(AutoPassPlanner.Placements(state, "p1", armies: 0));
    }

    [Fact]
    public void Inleggen_MetMinderDanVijfKaarten_IsNietNodig()
    {
        var state = NoordAmerikaVoorP1(hand:
        [
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-1"),
            Card("c4", "quebec", "symbol-2"),
        ]);

        Assert.Null(AutoPassPlanner.MandatoryTrade(state, "p1"));
    }

    /// <summary>FO §11.2: de set met de meeste kaarten van eigen gebieden; bij gelijkstand de eerste in de hand.</summary>
    [Fact]
    public void Inleggen_KiestDeSetMetDeMeesteKaartenVanEigenGebieden()
    {
        var state = NoordAmerikaVoorP1(hand:
        [
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "kamchatka", "symbol-1"),
            Card("c4", "ontario", "symbol-2"),
            Card("c5", "quebec", "symbol-3"),
        ]);

        var trade = AutoPassPlanner.MandatoryTrade(state, "p1");

        Assert.Equal(["c1", "c4", "c5"], trade!.Select(card => card.Id));
    }

    /// <summary>FO §11.2: bij een gelijke bezitsbonus gaan jokers als laatste weg.</summary>
    [Fact]
    public void Inleggen_BijGelijkeBezitsbonus_LiefstZonderJoker()
    {
        var state = NoordAmerikaVoorP1(hand:
        [
            Card("j1", null, "joker"),
            Card("c1", "kamchatka", "symbol-1"),
            Card("c2", "siam", "symbol-1"),
            Card("c3", "peru", "symbol-1"),
            Card("c4", "india", "symbol-2"),
        ]);

        var trade = AutoPassPlanner.MandatoryTrade(state, "p1");

        Assert.Equal(["c1", "c2", "c3"], trade!.Select(card => card.Id));
    }

    /// <summary>FO §11.2: "herhaald zolang de verplichting geldt" — na één inleg met 8 kaarten blijven er 5 over.</summary>
    [Fact]
    public void Inleggen_ZolangDeVerplichtingGeldt_VolgtErNogEenSet()
    {
        var state = NoordAmerikaVoorP1(hand:
        [
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-1"),
            Card("c4", "kamchatka", "symbol-2"),
            Card("c5", "siam", "symbol-2"),
            Card("c6", "peru", "symbol-2"),
            Card("c7", "india", "symbol-3"),
            Card("c8", "china", "symbol-3"),
        ]);

        var first = AutoPassPlanner.MandatoryTrade(state, "p1")!;
        var player = state.Player("p1");
        var afterFirst = state.WithPlayer(player with { Hand = [.. player.Hand.Where(card => !first.Contains(card))] });

        var second = AutoPassPlanner.MandatoryTrade(afterFirst, "p1");

        Assert.Equal(["c1", "c2", "c3"], first.Select(card => card.Id));
        Assert.NotNull(second);
    }

    private static GameState Verdediging(
        int attackDice, int defenderArmies, DefenseDiceRule rule, string brazilOwner = "p2")
    {
        var settings = TestGame.Settings() with { RolesEnabled = true, DefenseDiceRule = rule };
        var rolls = Enumerable.Repeat(4, attackDice).ToArray();

        return TestGame.InProgress(
                players: [TestGame.Player("p1", "red"), TestGame.Player("p2", "blue", roleId: "capoeirista")],
                turnPhase: TurnPhase.Attack,
                settings: settings,
                pendingCombat: new PendingCombat(
                    "alaska", "alberta", attackDice, rolls, AwaitingRerollDecision: false, CorrelationId: Guid.NewGuid()))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 4))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", defenderArmies))
            .WithTerritory(new TerritoryOwnership("brazil", brazilOwner, 1));
    }

    [Fact]
    public void Verdedigen_MetGenoegLegers_KiestHetMaximum()
    {
        var state = Verdediging(attackDice: 2, defenderArmies: 3, DefenseDiceRule.HouseRule);

        Assert.Equal(2, AutoPassPlanner.DefenseDice(state, "p2"));
    }

    [Fact]
    public void Verdedigen_MetEenLeger_KiestEenSteen()
    {
        var state = Verdediging(attackDice: 3, defenderArmies: 1, DefenseDiceRule.Classic);

        Assert.Equal(1, AutoPassPlanner.DefenseDice(state, "p2"));
    }

    [Fact]
    public void Verdedigen_KlassiekTegenEenAanvalssteen_KiestTwee()
    {
        var state = Verdediging(attackDice: 1, defenderArmies: 3, DefenseDiceRule.Classic);

        Assert.Equal(2, AutoPassPlanner.DefenseDice(state, "p2"));
    }

    /// <summary>FO §5.3 stap 4 / §11.2: de server zet een beschikbare DefenseBoost nooit in.</summary>
    [Fact]
    public void Verdedigen_HuisregelTegenEenAanvalssteen_ZetDeBoostNietIn()
    {
        var state = Verdediging(attackDice: 1, defenderArmies: 3, DefenseDiceRule.HouseRule);

        Assert.Equal(1, AutoPassPlanner.DefenseDice(state, "p2"));
    }

    [Fact]
    public void Verdedigen_ZonderLopendGevecht_IsEenBugInDeAanroeper()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 3));

        Assert.Throws<InvalidOperationException>(() => AutoPassPlanner.DefenseDice(state, "p2"));
    }
}
