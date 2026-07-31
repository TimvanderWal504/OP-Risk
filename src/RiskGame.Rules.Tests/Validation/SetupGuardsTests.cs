using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests;

public sealed class SetupGuardsTests
{
    private static GameState State(
        GamePhase phase,
        IReadOnlyList<TerritoryOwnership>? territories = null,
        int startingArmies = 10,
        SetupMode? setupMode = null)
    {
        var map = Standaard43Data.Load();
        var players = new[] { TestGame.Player("p1", "red"), TestGame.Player("p2", "blue") };

        return new GameState(
            gameId: "test-game",
            map,
            phase,
            TestGame.Settings() with { StartingArmies = startingArmies, SetupMode = setupMode ?? SetupMode.Random },
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

    /// <summary>
    /// FO §5.1: bij Claimen blijft bijplaatsen turn-based. TurnOrder ["p1","p2"] met gelijke
    /// budgetten maakt p1 de actieve plaatser (<see cref="SetupTurnCalculator.ActivePlacerId"/>);
    /// p2 moet dan geweigerd worden, mét de "niet jouw beurt"-foutcode.
    /// </summary>
    [Fact]
    public void IsPlayersTurnToPlace_BijClaimen_BlijftBeurtAfgedwongen()
    {
        var territories = new[] { new TerritoryOwnership("t1", "p1", 1), new TerritoryOwnership("t2", "p2", 1) };
        var state = State(GamePhase.InitialPlacement, territories, startingArmies: 10, setupMode: SetupMode.Claiming);

        Assert.True(SetupGuards.IsPlayersTurnToPlace(state, "p1").IsSuccess);

        var result = SetupGuards.IsPlayersTurnToPlace(state, "p2");
        Assert.False(result.IsSuccess);
        Assert.Contains(result.Errors, error => error.Code == "setup.notYourTurnToPlace");
    }

    /// <summary>
    /// FO §5.1: bij Random is er geen beurt. TurnOrder ["p1","p2"] zou bij Claimen p1 als
    /// actieve plaatser aanwijzen (gelijke budgetten) — bij Random mag p2 net zo goed
    /// plaatsen, puur op basis van eigen restbudget.
    /// </summary>
    [Fact]
    public void IsPlayersTurnToPlace_BijRandom_SpelerNietVoorinBeurtvolgorde_MagTochPlaatsen()
    {
        var territories = new[] { new TerritoryOwnership("t1", "p1", 1), new TerritoryOwnership("t2", "p2", 1) };
        var state = State(GamePhase.InitialPlacement, territories, startingArmies: 10, setupMode: SetupMode.Random);

        Assert.True(SetupGuards.IsPlayersTurnToPlace(state, "p1").IsSuccess);
        Assert.True(SetupGuards.IsPlayersTurnToPlace(state, "p2").IsSuccess);
    }

    /// <summary>
    /// FO §5.1: bij Random faalt plaatsen zodra het eigen budget op is, met een andere
    /// foutcode dan de beurt-gebonden variant (het gaat hier niet om een beurt) — terwijl
    /// een andere speler met budget intussen gewoon kan doorplaatsen.
    /// </summary>
    [Fact]
    public void IsPlayersTurnToPlace_BijRandom_SpelerZonderBudget_KrijgtNoArmiesLeftFoutcode()
    {
        var territories = new[] { new TerritoryOwnership("t1", "p1", 10), new TerritoryOwnership("t2", "p2", 1) };
        var state = State(GamePhase.InitialPlacement, territories, startingArmies: 10, setupMode: SetupMode.Random);

        var result = SetupGuards.IsPlayersTurnToPlace(state, "p1");
        Assert.False(result.IsSuccess);
        Assert.Contains(result.Errors, error => error.Code == "setup.noArmiesLeftToPlace");

        Assert.True(SetupGuards.IsPlayersTurnToPlace(state, "p2").IsSuccess);
    }
}
