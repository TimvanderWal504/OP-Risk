using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests.State;

/// <summary>
/// Het verloop op de TV (plan-testronde-tv punt 4): samenvoegen met alleen de bovenste regel,
/// oplopende volgnummers, afkappen, en bijwerken van een eerdere regel.
/// </summary>
public sealed class RecentActionLogTests
{
    private static RecentAction Placed(string playerId, string territoryId, int amount, int total) =>
        new(RecentActionKind.ArmiesPlaced, PlayerId: playerId, TerritoryId: territoryId, Amount: amount, Total: total);

    private static RecentAction Attack(string playerId, string from, string to, int attackerLosses, int defenderLosses) =>
        new(RecentActionKind.Attack, PlayerId: playerId, OtherPlayerId: "p2", TerritoryId: to, FromTerritoryId: from,
            AttackerLosses: attackerLosses, DefenderLosses: defenderLosses);

    private static IReadOnlyList<RecentAction> AppendAll(params RecentAction[] actions) =>
        actions.Aggregate((IReadOnlyList<RecentAction>)[], RecentActionLog.Append);

    [Fact]
    public void Append_NieuwsteVooraan_MetOplopendVolgnummer()
    {
        var log = AppendAll(
            new RecentAction(RecentActionKind.TerritoryClaimed, PlayerId: "p1", TerritoryId: "alaska"),
            new RecentAction(RecentActionKind.TerritoryClaimed, PlayerId: "p2", TerritoryId: "alberta"));

        Assert.Equal(["alberta", "alaska"], log.Select(action => action.TerritoryId));
        Assert.Equal([2, 1], log.Select(action => action.Sequence));
    }

    [Fact]
    public void Append_PlaatsingOpHetzelfdeGebiedDoorDezelfdeSpeler_VoegtSamenMetHetNieuweTotaal()
    {
        var log = AppendAll(Placed("p1", "brazil", 1, 2), Placed("p1", "brazil", 2, 4));

        var placed = Assert.Single(log);
        Assert.Equal(3, placed.Amount);
        Assert.Equal(4, placed.Total);
        Assert.Equal(1, placed.Sequence);
    }

    [Theory]
    [InlineData("p1", "peru")]
    [InlineData("p2", "brazil")]
    public void Append_PlaatsingOpEenAnderGebiedOfDoorEenAndereSpeler_IsEenNieuweRegel(string playerId, string territoryId)
    {
        var log = AppendAll(Placed("p1", "brazil", 1, 2), Placed(playerId, territoryId, 1, 2));

        Assert.Equal(2, log.Count);
    }

    [Fact]
    public void Append_WorpenOpHetzelfdeDoelVanuitHetzelfdeGebied_TellenDeVerliezenOp()
    {
        var log = AppendAll(Attack("p1", "brazil", "peru", 1, 1), Attack("p1", "brazil", "peru", 0, 2));

        var attack = Assert.Single(log);
        Assert.Equal(1, attack.AttackerLosses);
        Assert.Equal(3, attack.DefenderLosses);
    }

    [Theory]
    [InlineData("argentina", "peru")]
    [InlineData("brazil", "venezuela")]
    public void Append_EenAnderBronOfDoelgebied_IsEenNieuweBelegering(string from, string to)
    {
        var log = AppendAll(Attack("p1", "brazil", "peru", 1, 1), Attack("p1", from, to, 0, 2));

        Assert.Equal(2, log.Count);
    }

    [Fact]
    public void Append_EenTussenliggendeRegel_BreektDeReeks_OokOverEenBeurtgrens()
    {
        var log = AppendAll(
            Placed("p1", "brazil", 3, 8),
            new RecentAction(RecentActionKind.ReinforcementsGranted, PlayerId: "p1", Amount: 3),
            Placed("p1", "brazil", 3, 11));

        Assert.Equal(3, log.Count);
        Assert.Equal([3, 3], log.Where(action => action.Kind == RecentActionKind.ArmiesPlaced).Select(action => action.Amount!.Value));
    }

    [Fact]
    public void Append_DeWillekeurigeVerdeling_IsEenRegel()
    {
        var dealt = new RecentAction(RecentActionKind.TerritoriesDealt);

        var log = AppendAll(dealt, dealt, dealt);

        Assert.Equal(RecentActionKind.TerritoriesDealt, Assert.Single(log).Kind);
    }

    [Fact]
    public void Append_OverigeSoorten_VoegenNooitSamen()
    {
        var traded = new RecentAction(RecentActionKind.CardsTraded, PlayerId: "p1", Amount: 4);

        Assert.Equal(2, AppendAll(traded, traded).Count);
    }

    [Fact]
    public void Append_KaptAfOpHetMaximum_EnHoudtDeNieuwste()
    {
        var actions = Enumerable.Range(1, RecentActionLog.MaxEntries + 3)
            .Select(i => new RecentAction(RecentActionKind.CardsTraded, PlayerId: "p1", Amount: i))
            .ToArray();

        var log = AppendAll(actions);

        Assert.Equal(RecentActionLog.MaxEntries, log.Count);
        Assert.Equal(RecentActionLog.MaxEntries + 3, log[0].Sequence);
        Assert.Equal(RecentActionLog.MaxEntries + 3, log[0].Amount);
        Assert.Equal(4, log[^1].Amount);
    }

    [Fact]
    public void Update_WerktDeMeestRecentePassendeRegelBij_OokAlsDieNietBovenaanStaat()
    {
        var log = AppendAll(
            new RecentAction(RecentActionKind.Conquered, PlayerId: "p1", TerritoryId: "peru"),
            new RecentAction(RecentActionKind.PlayerEliminated, PlayerId: "p1", OtherPlayerId: "p2"));

        var updated = RecentActionLog.Update(
            log,
            action => action.Kind == RecentActionKind.Conquered,
            action => action with { Amount = 3, Total = 3, Sequence = 99 });

        Assert.Equal(RecentActionKind.PlayerEliminated, updated[0].Kind);
        Assert.Equal(3, updated[1].Amount);
        Assert.Equal(1, updated[1].Sequence);
    }

    [Fact]
    public void GameState_ElkeWith_BehoudtHetVerloop()
    {
        var log = AppendAll(Placed("p1", "brazil", 1, 2));
        var state = new GameState(
            "test-game",
            Standaard43Data.Load(),
            GamePhase.InProgress,
            TestGame.Settings(),
            [TestGame.Player("p1", "red")],
            territories: [],
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []).WithRecentActions(log);

        var copies = new[]
        {
            state.WithPhase(GamePhase.Finished),
            state.WithTurnState(null),
            state.WithDeck(state.Deck),
            state.WithTurnOrder(["p1"]),
            state.WithActiveEffects([]),
            state.WithWinners(["p1"]),
            state.WithPendingWin(null),
            state.WithTvDisplay(TvDisplaySettings.Default),
            state.WithPlayer(state.Player("p1")),
        };

        Assert.All(copies, copy => Assert.Same(log, copy.RecentActions));
    }

    [Fact]
    public void Update_ZonderPassendeRegel_LaatHetLogOngewijzigd()
    {
        var log = AppendAll(Placed("p1", "brazil", 1, 2));

        var updated = RecentActionLog.Update(log, action => action.Kind == RecentActionKind.Conquered, action => action);

        Assert.Same(log, updated);
    }
}
