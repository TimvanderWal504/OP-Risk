using RiskGame.Rules.Map;
using RiskGame.Rules.Missions;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Bevestigt de omvang en de afwijkingen van de wereld-49-kaart ten opzichte van
/// standaard-43 (FO §4.5). De getallen zijn geteld uit de databestanden.
/// </summary>
public class Wereld49Tests
{
    private const string MapId = "wereld-49";

    private static MapDefinition Load() => MapTestData.Load(MapId);

    [Fact]
    public void EchteSpeeldata_IsGeldig()
    {
        var result = MapDefinitionParser.Parse(MapId, MapTestData.Sources(MapId));

        Assert.True(result.IsSuccess, string.Join(" | ", result.Errors));
    }

    [Fact]
    public void Kaart_Bevat_NegenenveertigGebieden()
    {
        Assert.Equal(49, Load().Territories.Count);
    }

    [Fact]
    public void AlleGebiedenVanStandaard43_BestaanOokOpWereld49()
    {
        var wereld = Load();

        var missing = Standaard43Data.Load().Territories
            .Select(territory => territory.Id)
            .Where(id => !wereld.HasTerritory(id))
            .ToList();

        Assert.Empty(missing);
    }

    [Theory]
    [InlineData("chile", "south-america")]
    [InlineData("hawaii", "north-america")]
    [InlineData("azores", "europe")]
    [InlineData("west-africa", "africa")]
    [InlineData("western-china", "asia")]
    [InlineData("philippines", "australia")]
    public void NieuwGebied_HoortBijHetVastgesteldeContinent(string territoryId, string continent)
    {
        var territory = Load().Territories.Single(territory => territory.Id == territoryId);

        Assert.Equal(continent, territory.Continent);
    }

    [Fact]
    public void Kaart_Bevat_NegenennegentigGrenzen_AchtenzestigLandEnEenendertigZee()
    {
        var borders = Load().Borders;

        Assert.Equal(99, borders.Count);
        Assert.Equal(68, borders.Count(border => border.Type == BorderType.Land));
        Assert.Equal(31, borders.Count(border => border.Type == BorderType.Sea));
    }

    [Theory]
    [InlineData("hawaii", "western-united-states")]
    [InlineData("hawaii", "japan")]
    [InlineData("azores", "western-europe")]
    [InlineData("azores", "north-africa")]
    [InlineData("philippines", "siam")]
    [InlineData("philippines", "indonesia")]
    [InlineData("new-zealand", "peru")]
    public void Zeeroute_BestaatZoalsBesloten(string from, string to)
    {
        Assert.Contains(
            Load().Borders,
            border => border.Type == BorderType.Sea
                && ((border.From == from && border.To == to) || (border.From == to && border.To == from)));
    }

    [Fact]
    public void Continentbonussen_ZijnGelijkAanStandaard43()
    {
        static Dictionary<string, int> Bonuses(MapDefinition map) =>
            map.Continents.ToDictionary(continent => continent.Id, continent => continent.Bonus);

        Assert.Equal(Bonuses(Standaard43Data.Load()), Bonuses(Load()));
    }

    [Fact]
    public void Deck_Bevat_EenenvijftigKaarten_VerdeeldOver16_16_17()
    {
        var deck = Load().Deck;
        var perSymbol = deck
            .Where(card => !card.IsJoker)
            .GroupBy(card => card.Symbol, StringComparer.Ordinal)
            .Select(group => group.Count())
            .Order()
            .ToList();

        // 49 gebiedskaarten + 2 jokers; 49 is niet deelbaar door 3.
        Assert.Equal(51, deck.Count);
        Assert.Equal([16, 16, 17], perSymbol);
    }

    [Fact]
    public void GebiedsaantalMissies_HebbenDeDrempelsVanWereld49()
    {
        var missions = Load().Missions;

        var territoryCount = Assert.IsType<TerritoryCountMission>(missions.Single(mission => mission.Id == "territory-30"));
        Assert.Equal(30, territoryCount.Count);
        Assert.Equal(3, territoryCount.MinPlayers);

        var withArmies = Assert.IsType<TerritoryCountMinArmiesMission>(missions.Single(mission => mission.Id == "territory-24-min2"));
        Assert.Equal(24, withArmies.Count);
        Assert.Equal(2, withArmies.MinArmies);
        Assert.Equal(4, withArmies.MinPlayers);
    }

    [Fact]
    public void OverigeMissies_ZijnGelijkAanStandaard43()
    {
        string[] countMissions = ["territory-24", "territory-18-min2", "territory-30", "territory-24-min2"];

        static IEnumerable<string> OtherIds(MapDefinition map, string[] excluded) =>
            map.Missions.Select(mission => mission.Id).Where(id => !excluded.Contains(id)).Order(StringComparer.Ordinal);

        Assert.Equal(OtherIds(Standaard43Data.Load(), countMissions), OtherIds(Load(), countMissions));
    }

    [Fact]
    public void RollenEnGebeurtenissen_ZijnGelijkAanStandaard43()
    {
        var standaard = Standaard43Data.Load();
        var wereld = Load();

        Assert.Equal(standaard.Roles.Select(role => role.Id), wereld.Roles.Select(role => role.Id));
        Assert.Equal(standaard.Events.Select(e => e.Id), wereld.Events.Select(e => e.Id));
    }
}
