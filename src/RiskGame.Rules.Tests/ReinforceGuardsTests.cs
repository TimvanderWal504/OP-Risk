using RiskGame.Rules.Map;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class ReinforceGuardsTests
{
    private static Card Card(string id, string? territoryId, string symbol) => new(id, territoryId, symbol);

    [Fact]
    public void Plaatsen_OpEigenGebiedInVersterkingsfase_IsGeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var result = ReinforceGuards.CanPlaceArmies(state, "p1", "alaska", amount: 2);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Plaatsen_OpNietEigenGebied_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce)
            .WithTerritory(new TerritoryOwnership("alaska", "p2", 1));

        var result = ReinforceGuards.CanPlaceArmies(state, "p1", "alaska", amount: 2);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void Plaatsen_BuitenDeVersterkingsfase_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var result = ReinforceGuards.CanPlaceArmies(state, "p1", "alaska", amount: 2);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void Plaatsen_MetNulLegers_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1));

        var result = ReinforceGuards.CanPlaceArmies(state, "p1", "alaska", amount: 0);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void MustTradeInCards_MetVijfOfMeerKaarten_IsVerplicht()
    {
        var hand = Enumerable.Range(0, 5).Select(i => Card($"c{i}", "alaska", "symbol-1")).ToArray();
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players);

        Assert.True(ReinforceGuards.MustTradeInCards(state, "p1"));
    }

    [Fact]
    public void MustTradeInCards_MetVierKaarten_IsNietVerplicht()
    {
        var hand = Enumerable.Range(0, 4).Select(i => Card($"c{i}", "alaska", "symbol-1")).ToArray();
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players);

        Assert.False(ReinforceGuards.MustTradeInCards(state, "p1"));
    }

    [Fact]
    public void CanTradeInCards_MetGeldigeSetInEigenBezit_IsGeldig()
    {
        var hand = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-1"),
        };
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Reinforce);

        var result = ReinforceGuards.CanTradeInCards(state, "p1", ["c1", "c2", "c3"]);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void CanTradeInCards_MetKaartDieDeSpelerNietBezit_IsOngeldig()
    {
        var hand = new[] { Card("c1", "alaska", "symbol-1"), Card("c2", "alberta", "symbol-1") };
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Reinforce);

        var result = ReinforceGuards.CanTradeInCards(state, "p1", ["c1", "c2", "onbekend"]);

        Assert.False(result.IsSuccess);
        Assert.Contains("niet in bezit", result.Errors.Single());
    }

    [Fact]
    public void CanTradeInCards_MetOngeldigeSet_IsOngeldig()
    {
        var hand = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-2"),
        };
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Reinforce);

        var result = ReinforceGuards.CanTradeInCards(state, "p1", ["c1", "c2", "c3"]);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void CanTradeInCards_BuitenDeVersterkingsfase_IsOngeldig()
    {
        var hand = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-1"),
        };
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Attack);

        var result = ReinforceGuards.CanTradeInCards(state, "p1", ["c1", "c2", "c3"]);

        Assert.False(result.IsSuccess);
    }
}
