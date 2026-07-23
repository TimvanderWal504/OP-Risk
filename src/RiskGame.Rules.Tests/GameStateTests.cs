using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class GameStateTests
{
    [Fact]
    public void WithTerritory_LaatDeOorspronkelijkeStateOngemoeid()
    {
        var state = TestGame.InProgress();

        var updated = state.WithTerritory(new TerritoryOwnership("iceland", "p1", 5));

        Assert.Null(state.Territory("iceland").OwnerPlayerId);
        Assert.Equal("p1", updated.Territory("iceland").OwnerPlayerId);
        Assert.Equal(5, updated.Territory("iceland").ArmyCount);
    }

    [Fact]
    public void WithTerritory_RaaktGeenAndereGebieden()
    {
        var state = TestGame.InProgress().WithTerritory(new TerritoryOwnership("japan", "p2", 3));

        var updated = state.WithTerritory(new TerritoryOwnership("iceland", "p1", 5));

        Assert.Equal("p2", updated.Territory("japan").OwnerPlayerId);
        Assert.Equal(state.Territories.Count, updated.Territories.Count);
    }

    [Fact]
    public void WithPlayer_LaatDeOorspronkelijkeStateOngemoeid()
    {
        var state = TestGame.InProgress();

        var updated = state.WithPlayer(state.Player("p2") with { IsEliminated = true });

        Assert.False(state.Player("p2").IsEliminated);
        Assert.True(updated.Player("p2").IsEliminated);
        Assert.False(updated.Player("p1").IsEliminated);
    }

    [Fact]
    public void WithPhase_LaatDeOorspronkelijkeStateOngemoeid()
    {
        var state = TestGame.InProgress();

        var updated = state.WithPhase(GamePhase.Finished);

        Assert.Equal(GamePhase.InProgress, state.Phase);
        Assert.Equal(GamePhase.Finished, updated.Phase);
    }

    [Fact]
    public void WithTurnState_KanDeBeurtOokWissen()
    {
        var state = TestGame.InProgress();

        var updated = state.WithTurnState(null);

        Assert.NotNull(state.TurnState);
        Assert.Null(updated.TurnState);
    }

    [Fact]
    public void WithTerritory_VoorEenOnbekendGebied_IsEenBug()
    {
        var state = TestGame.InProgress();

        // Geen ValidationResult: een gebied dat niet op de kaart staat is geen ongeldige
        // zet maar een fout in de aanroeper.
        Assert.Throws<InvalidOperationException>(
            () => state.WithTerritory(new TerritoryOwnership("atlantis", "p1", 1)));
    }

    [Fact]
    public void TerritoriesOf_GeeftAlleenDeGebiedenVanDieSpeler()
    {
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("iceland", "p1", 2))
            .WithTerritory(new TerritoryOwnership("japan", "p1", 1))
            .WithTerritory(new TerritoryOwnership("peru", "p2", 4));

        var owned = state.TerritoriesOf("p1").Select(territory => territory.TerritoryId).ToArray();

        Assert.Equal(["iceland", "japan"], owned.Order());
    }

    [Fact]
    public void EenOnbezetGebied_HoortBijNiemand()
    {
        var state = TestGame.InProgress();

        Assert.Empty(state.TerritoriesOf("p1"));
        Assert.Null(state.Territory("iceland").OwnerPlayerId);
    }

    [Fact]
    public void HasTerritory_KentAlleenDeGebiedenVanDeKaartvariant()
    {
        var state = TestGame.InProgress();

        Assert.True(state.HasTerritory("iceland"));
        Assert.False(state.HasTerritory("atlantis"));
    }

    [Fact]
    public void HasPlayer_KentAlleenDeDeelnemers()
    {
        var state = TestGame.InProgress();

        Assert.True(state.HasPlayer("p1"));
        Assert.False(state.HasPlayer("p9"));
    }

    [Fact]
    public void DeStateDraagtAlleGebiedenVanDeKaartvariant()
    {
        var state = TestGame.InProgress();

        Assert.Equal(state.Map.Territories.Count, state.Territories.Count);
    }
}
