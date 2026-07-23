using RiskGame.Rules.Map;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class CardTradeCalculatorTests
{
    private static Card Card(string id, string? territoryId, string symbol) => new(id, territoryId, symbol);

    [Fact]
    public void SetWaarde_VolgtDeHuidigeInlegwaardeUitHetDeck()
    {
        var state = TestGame.InProgress(nextTradeValue: 8)
            .WithTerritory(new TerritoryOwnership("alaska", "p2", 1))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p2", 1));

        var cards = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-1"),
        };

        var outcome = CardTradeCalculator.Evaluate(state, "p1", cards);

        Assert.Equal(8, outcome.SetValue);
    }

    [Fact]
    public void BezitsbonusAlleenVoorKaartenVanGebiedenDieDeSpelerNuBezit()
    {
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 1))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1));

        var cards = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-1"),
        };

        var outcome = CardTradeCalculator.Evaluate(state, "p1", cards);

        Assert.Equal(2, outcome.OwnedTerritoryBonuses.Count);
        Assert.Contains(outcome.OwnedTerritoryBonuses, bonus => bonus.TerritoryId == "alaska" && bonus.Amount == 2);
        Assert.Contains(outcome.OwnedTerritoryBonuses, bonus => bonus.TerritoryId == "ontario" && bonus.Amount == 2);
        Assert.DoesNotContain(outcome.OwnedTerritoryBonuses, bonus => bonus.TerritoryId == "alberta");
    }

    [Fact]
    public void GeenBezitsbonusVoorEenJoker()
    {
        var state = TestGame.InProgress();

        var cards = new[]
        {
            Card("c1", null, CardDeckBuilder.JokerSymbol),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-1"),
        };

        var outcome = CardTradeCalculator.Evaluate(state, "p1", cards);

        Assert.Empty(outcome.OwnedTerritoryBonuses);
    }

    [Theory]
    [InlineData(4, 6)]
    [InlineData(6, 8)]
    [InlineData(8, 10)]
    [InlineData(10, 12)]
    [InlineData(12, 15)]
    [InlineData(15, 20)]
    [InlineData(20, 25)]
    [InlineData(25, 30)]
    public void EscalerendeInlegwaarde_VolgtDeKlassiekeReeks(int current, int expectedNext)
    {
        Assert.Equal(expectedNext, CardTradeCalculator.NextTradeValueAfter(current));
    }
}
