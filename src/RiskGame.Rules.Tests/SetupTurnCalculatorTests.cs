using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests;

public sealed class SetupTurnCalculatorTests
{
    private static GameState State(
        IReadOnlyList<Player> players,
        IReadOnlyList<TerritoryOwnership> territories,
        GamePhase phase,
        int startingArmies = 10)
    {
        var map = Standaard43Data.Load();

        return new GameState(
            gameId: "test-game",
            map,
            phase,
            TestGame.Settings() with { StartingArmies = startingArmies },
            players,
            territories,
            turnOrder: [.. players.Select(player => player.Id)],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);
    }

    [Fact]
    public void ActiveClaimerId_ZonderGeclaimdeGebieden_IsDeEersteSpelerInTurnOrder()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var territories = new[]
        {
            new TerritoryOwnership("t1", null, 0),
            new TerritoryOwnership("t2", null, 0),
        };
        var state = State(players, territories, GamePhase.Claiming);

        Assert.Equal("p1", SetupTurnCalculator.ActiveClaimerId(state));
    }

    [Fact]
    public void ActiveClaimerId_RoteertRondJeIedereenTerugkomt()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var territories = new[]
        {
            new TerritoryOwnership("t1", "p1", 1),
            new TerritoryOwnership("t2", null, 0),
            new TerritoryOwnership("t3", null, 0),
        };
        var state = State(players, territories, GamePhase.Claiming);

        Assert.Equal("p2", SetupTurnCalculator.ActiveClaimerId(state));
    }

    [Fact]
    public void ActiveClaimerId_NaEenVolledigeRonde_IsWeerDeEerste()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var territories = new[]
        {
            new TerritoryOwnership("t1", "p1", 1),
            new TerritoryOwnership("t2", "p2", 1),
            new TerritoryOwnership("t3", null, 0),
        };
        var state = State(players, territories, GamePhase.Claiming);

        Assert.Equal("p1", SetupTurnCalculator.ActiveClaimerId(state));
    }

    [Fact]
    public void ActivePlacerId_MetGelijkeBudgetten_RoteertOverAlleSpelers()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        // Elk 2 gebieden, dus elk nog 10 - 2 = 8 legers te plaatsen: geen speler valt eerder af.
        var territories = new[]
        {
            new TerritoryOwnership("t1", "p1", 1),
            new TerritoryOwnership("t2", "p2", 1),
            new TerritoryOwnership("t3", "p1", 1),
            new TerritoryOwnership("t4", "p2", 1),
        };
        var state = State(players, territories, GamePhase.InitialPlacement, startingArmies: 10);

        Assert.Equal("p1", SetupTurnCalculator.ActivePlacerId(state));
    }

    [Fact]
    public void ActivePlacerId_SlaatEenSpelerZonderResterendBudgetOver()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        // p1 heeft 3 gebieden (budget 4 - 3 = 1), p2 heeft 1 gebied (budget 4 - 1 = 3): p1 is
        // na zijn ene plaatsing meteen klaar, terwijl p2 nog verder moet.
        var territories = new[]
        {
            new TerritoryOwnership("t1", "p1", 2), // p1: budget op (2+1+1 = 4 = startingArmies)
            new TerritoryOwnership("t2", "p1", 1),
            new TerritoryOwnership("t3", "p1", 1),
            new TerritoryOwnership("t4", "p2", 2), // p2: nog 4 - 2 = 2 legers te plaatsen
        };
        var state = State(players, territories, GamePhase.InitialPlacement, startingArmies: 4);

        // p1 is klaar (0 resterend); p2 heeft nog legers over, dus die is aan de beurt.
        Assert.Equal("p2", SetupTurnCalculator.ActivePlacerId(state));
    }

    [Fact]
    public void ActivePlacerId_AlsIedereenKlaarIs_IsNull()
    {
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };
        var territories = new[]
        {
            new TerritoryOwnership("t1", "p1", 5),
            new TerritoryOwnership("t2", "p2", 5),
        };
        var state = State(players, territories, GamePhase.InitialPlacement, startingArmies: 5);

        Assert.Null(SetupTurnCalculator.ActivePlacerId(state));
    }
}
