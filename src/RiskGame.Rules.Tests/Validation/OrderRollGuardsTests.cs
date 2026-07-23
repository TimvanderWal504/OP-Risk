using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests;

public sealed class OrderRollGuardsTests
{
    private static GameState OrderRollState(IReadOnlyList<Player>? players = null)
    {
        var map = Standaard43Data.Load();

        return new GameState(
            gameId: "test-game",
            map,
            GamePhase.OrderRoll,
            TestGame.Settings(),
            players ?? [TestGame.Player("p1", "red"), TestGame.Player("p2", "blue")],
            territories: [],
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);
    }

    [Fact]
    public void GameIsInOrderRoll_InOrderRollFase_IsGeldig() =>
        Assert.True(OrderRollGuards.GameIsInOrderRoll(OrderRollState()).IsSuccess);

    [Fact]
    public void GameIsInOrderRoll_BuitenOrderRollFase_IsOngeldig()
    {
        var map = Standaard43Data.Load();
        var state = new GameState(
            "test-game", map, GamePhase.Lobby, TestGame.Settings(),
            players: [], territories: [], turnOrder: [], turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4), activeEffects: []);

        Assert.False(OrderRollGuards.GameIsInOrderRoll(state).IsSuccess);
    }

    [Fact]
    public void PlayerMayRoll_AlsSpelerNogMoetGooien_IsGeldig()
    {
        var state = OrderRollState();
        var progress = new OrderRollProgress(StillToRoll: ["p1", "p2"], Winner: null);

        Assert.True(OrderRollGuards.PlayerMayRoll(state, "p1", progress).IsSuccess);
    }

    [Fact]
    public void PlayerMayRoll_AlsSpelerAlHeeftGegooid_IsOngeldig()
    {
        var state = OrderRollState();
        var progress = new OrderRollProgress(StillToRoll: ["p2"], Winner: null);

        Assert.False(OrderRollGuards.PlayerMayRoll(state, "p1", progress).IsSuccess);
    }
}
