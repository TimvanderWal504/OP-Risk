using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests;

public sealed class SetupGuardsTests
{
    private static GameState State(
        GamePhase phase,
        IReadOnlyList<TerritoryOwnership>? territories = null,
        int startingArmies = 10)
    {
        var map = Standaard43Data.Load();
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };

        return new GameState(
            gameId: "test-game",
            map,
            phase,
            TestGame.Settings() with { StartingArmies = startingArmies },
            players,
            territories ?? [new TerritoryOwnership("t1", null, 0), new TerritoryOwnership("t2", null, 0)],
            turnOrder: ["p1", "p2"],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);
    }

    [Fact]
    public void GameIsInClaiming_InClaimingFase_IsGeldig() =>
        Assert.True(SetupGuards.GameIsInClaiming(State(GamePhase.Claiming)).IsSuccess);

    [Fact]
    public void GameIsInClaiming_BuitenClaimingFase_IsOngeldig() =>
        Assert.False(SetupGuards.GameIsInClaiming(State(GamePhase.InitialPlacement)).IsSuccess);

    [Fact]
    public void GameIsInInitialPlacement_InInitialPlacementFase_IsGeldig() =>
        Assert.True(SetupGuards.GameIsInInitialPlacement(State(GamePhase.InitialPlacement)).IsSuccess);

    [Fact]
    public void IsPlayersTurnToClaim_VoorDeSpelerAanDeBeurt_IsGeldig() =>
        Assert.True(SetupGuards.IsPlayersTurnToClaim(State(GamePhase.Claiming), "p1").IsSuccess);

    [Fact]
    public void IsPlayersTurnToClaim_VoorEenAndereSpeler_IsOngeldig() =>
        Assert.False(SetupGuards.IsPlayersTurnToClaim(State(GamePhase.Claiming), "p2").IsSuccess);

    [Fact]
    public void TerritoryIsFree_VoorEenVrijGebied_IsGeldig() =>
        Assert.True(SetupGuards.TerritoryIsFree(State(GamePhase.Claiming), "t1").IsSuccess);

    [Fact]
    public void TerritoryIsFree_VoorEenAlGeclaimdGebied_IsOngeldig()
    {
        var territories = new[] { new TerritoryOwnership("t1", "p1", 1), new TerritoryOwnership("t2", null, 0) };
        var state = State(GamePhase.Claiming, territories);

        Assert.False(SetupGuards.TerritoryIsFree(state, "t1").IsSuccess);
    }

    [Fact]
    public void IsPlayersTurnToPlace_VoorDeSpelerAanDeBeurt_IsGeldig()
    {
        var territories = new[] { new TerritoryOwnership("t1", "p1", 1), new TerritoryOwnership("t2", "p2", 1) };
        var state = State(GamePhase.InitialPlacement, territories);

        Assert.True(SetupGuards.IsPlayersTurnToPlace(state, "p1").IsSuccess);
    }

    [Fact]
    public void IsPlayersTurnToPlace_AlsBijplaatsenAlKlaarIs_IsOngeldigVoorIedereen()
    {
        var territories = new[]
        {
            new TerritoryOwnership("t1", "p1", 10),
            new TerritoryOwnership("t2", "p2", 10),
        };
        var state = State(GamePhase.InitialPlacement, territories);

        Assert.False(SetupGuards.IsPlayersTurnToPlace(state, "p1").IsSuccess);
        Assert.False(SetupGuards.IsPlayersTurnToPlace(state, "p2").IsSuccess);
    }
}
