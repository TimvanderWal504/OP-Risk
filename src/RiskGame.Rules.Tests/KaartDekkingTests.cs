using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Het deck wordt afgeleid uit de gebieden (FO §4.4). Deze tests bewaken dat de
/// afleiding sluitend en deterministisch is.
/// </summary>
public class KaartDekkingTests
{
    public static TheoryData<string> MapIds() => MapTestData.MapIds();

    [Fact]
    public void Deck_Bevat_VijfenveertigKaarten()
    {
        Assert.Equal(45, Standaard43Data.Load().Deck.Count);
    }

    [Theory]
    [MemberData(nameof(MapIds))]
    public void ElkGebied_HeeftPreciesEenKaart(string mapId)
    {
        var map = MapTestData.Load(mapId);

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
    public void Standaard43_HeeftTweeJokers()
    {
        Assert.Equal(2, Standaard43Data.Load().Deck.Count(card => card.IsJoker));
    }

    [Theory]
    [MemberData(nameof(MapIds))]
    public void Jokers_HebbenGeenGebied_EnHetJokersymbool(string mapId)
    {
        var map = MapTestData.Load(mapId);
        var jokers = map.Deck.Where(card => card.IsJoker).ToList();

        Assert.Equal(map.Deck.Count - map.Territories.Count, jokers.Count);
        Assert.All(jokers, joker => Assert.Null(joker.TerritoryId));
        Assert.All(jokers, joker => Assert.Equal(CardDeckBuilder.JokerSymbol, joker.Symbol));
    }

    [Theory]
    [MemberData(nameof(MapIds))]
    public void Symbolen_ZijnZoGelijkMogelijkVerdeeld(string mapId)
    {
        var map = MapTestData.Load(mapId);
        var perSymbol = map.Deck
            .Where(card => !card.IsJoker)
            .GroupBy(card => card.Symbol, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.Count());

        // Is het aantal gebieden niet deelbaar door 3, dan krijgt een symbool er één extra.
        Assert.Equal(3, perSymbol.Count);
        Assert.Equal(map.Territories.Count, perSymbol.Values.Sum());
        Assert.InRange(perSymbol.Values.Max() - perSymbol.Values.Min(), 0, 1);
    }

    [Fact]
    public void Standaard43_HeeftEenSymboolMetEenExtraKaart()
    {
        var perSymbol = Standaard43Data.Load().Deck
            .Where(card => !card.IsJoker)
            .GroupBy(card => card.Symbol, StringComparer.Ordinal)
            .Select(group => group.Count())
            .Order()
            .ToList();

        Assert.Equal([14, 14, 15], perSymbol);
    }

    [Theory]
    [MemberData(nameof(MapIds))]
    public void KaartIds_ZijnUniek(string mapId)
    {
        var deck = MapTestData.Load(mapId).Deck;

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
