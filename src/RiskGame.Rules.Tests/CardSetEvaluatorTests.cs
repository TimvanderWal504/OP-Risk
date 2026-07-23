using RiskGame.Rules.Map;
using RiskGame.Rules.Reinforcement;

namespace RiskGame.Rules.Tests;

public class CardSetEvaluatorTests
{
    private static readonly CardSetRules Rules = new(
        ValidSets: ["three-of-a-kind", "one-of-each"], JokerIsWild: true, OwnedTerritoryBonus: 2);

    private static Card Card(string id, string? territoryId, string symbol) => new(id, territoryId, symbol);

    [Fact]
    public void DrieGelijkeSymbolen_IsGeldig()
    {
        var cards = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-1"),
        };

        var result = CardSetEvaluator.Validate(Rules, cards);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void DrieVerschillendeSymbolen_IsGeldig()
    {
        var cards = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-2"),
            Card("c3", "ontario", "symbol-3"),
        };

        var result = CardSetEvaluator.Validate(Rules, cards);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void EenJokerAlsWildcardBijDrieGelijk_IsGeldig()
    {
        var cards = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", null, CardDeckBuilder.JokerSymbol),
        };

        var result = CardSetEvaluator.Validate(Rules, cards);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void TweeJokersMetEenSymbool_IsGeldig()
    {
        var cards = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", null, CardDeckBuilder.JokerSymbol),
            Card("c3", null, CardDeckBuilder.JokerSymbol),
        };

        var result = CardSetEvaluator.Validate(Rules, cards);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void TweeGelijkPlusEenAnderZonderJoker_IsOngeldig()
    {
        var cards = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", "ontario", "symbol-2"),
        };

        var result = CardSetEvaluator.Validate(Rules, cards);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void JokerTerwijlNietWild_IsOngeldig()
    {
        var rules = Rules with { JokerIsWild = false };

        var cards = new[]
        {
            Card("c1", "alaska", "symbol-1"),
            Card("c2", "alberta", "symbol-1"),
            Card("c3", null, CardDeckBuilder.JokerSymbol),
        };

        var result = CardSetEvaluator.Validate(rules, cards);

        Assert.False(result.IsSuccess);
    }

    [Theory]
    [InlineData(2)]
    [InlineData(4)]
    public void VerkeerdAantalKaarten_IsOngeldig(int count)
    {
        var cards = Enumerable.Range(0, count)
            .Select(i => Card($"c{i}", "alaska", "symbol-1"))
            .ToArray();

        var result = CardSetEvaluator.Validate(Rules, cards);

        Assert.False(result.IsSuccess);
    }
}
