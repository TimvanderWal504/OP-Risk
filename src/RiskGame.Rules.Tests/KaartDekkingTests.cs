using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Het deck wordt afgeleid uit de gebieden (FO §4.4). Deze tests bewaken dat de
/// afleiding sluitend en deterministisch is.
/// </summary>
public class KaartDekkingTests
{
    [Fact]
    public void Deck_Bevat_VijfenveertigKaarten()
    {
        Assert.Equal(45, Standaard43Data.Load().Deck.Count);
    }

    [Fact]
    public void ElkGebied_HeeftPreciesEenKaart()
    {
        var map = Standaard43Data.Load();

        var territoryIds = map.Territories.Select(territory => territory.Id).ToList();
        var cardTerritoryIds = map.Deck
            .Where(card => !card.IsJoker)
            .Select(card => card.TerritoryId!)
            .ToList();

        Assert.Equal(territoryIds.Count, cardTerritoryIds.Count);
        Assert.Equal(
            territoryIds.OrderBy(id => id, StringComparer.Ordinal),
            cardTerritoryIds.OrderBy(id => id, StringComparer.Ordinal));
    }

    [Fact]
    public void Deck_Bevat_TweeJokersZonderGebied()
    {
        var jokers = Standaard43Data.Load().Deck.Where(card => card.IsJoker).ToList();

        Assert.Equal(2, jokers.Count);
        Assert.All(jokers, joker => Assert.Null(joker.TerritoryId));
        Assert.All(jokers, joker => Assert.Equal(CardDeckBuilder.JokerSymbol, joker.Symbol));
    }

    [Fact]
    public void Symbolen_ZijnZoGelijkMogelijkVerdeeld()
    {
        var perSymbol = Standaard43Data.Load().Deck
            .Where(card => !card.IsJoker)
            .GroupBy(card => card.Symbol, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.Count());

        // 43 gebieden over 3 symbolen: één symbool krijgt er onvermijdelijk één extra.
        Assert.Equal(3, perSymbol.Count);
        Assert.Equal(43, perSymbol.Values.Sum());
        Assert.Equal(1, perSymbol.Values.Max() - perSymbol.Values.Min());
    }

    [Fact]
    public void KaartIds_ZijnUniek()
    {
        var deck = Standaard43Data.Load().Deck;

        Assert.Equal(deck.Count, deck.Select(card => card.Id).Distinct(StringComparer.Ordinal).Count());
    }

    [Fact]
    public void TweemaalAfleiden_GeeftHetzelfdeDeck()
    {
        var eerste = Standaard43Data.Load().Deck;
        var tweede = Standaard43Data.Load().Deck;

        Assert.Equal(eerste, tweede);
    }

    [Fact]
    public void ElkKaartsymbool_HeeftEenWeergavenaamInElkThema()
    {
        var map = Standaard43Data.Load();
        var symbols = map.Deck.Select(card => card.Symbol).Distinct(StringComparer.Ordinal);

        Assert.NotEmpty(map.Themes);
        foreach (var theme in map.Themes)
        {
            foreach (var symbol in symbols)
            {
                Assert.True(
                    theme.Value.ContainsKey(symbol),
                    $"Thema '{theme.Key}' mist een weergavenaam voor '{symbol}'.");
            }
        }
    }
}
