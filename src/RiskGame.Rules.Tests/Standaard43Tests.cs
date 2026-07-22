using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Bevestigt de omvang en kernwaarden van de standaard-43-kaart. De getallen zijn
/// geteld uit de databestanden, niet overgenomen uit documentatie.
/// </summary>
public class Standaard43Tests
{
    [Fact]
    public void EchteSpeeldata_IsGeldig()
    {
        var result = MapDefinitionParser.Parse(Standaard43Data.MapId, Standaard43Data.Sources());

        Assert.True(result.IsSuccess, string.Join(" | ", result.Errors));
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Kaart_Bevat_DrieenveertigGebieden()
    {
        Assert.Equal(43, Standaard43Data.Load().Territories.Count);
    }

    [Fact]
    public void Kaart_Bevat_VierentachtigGrenzen_ZestigLandEnVierentwintigZee()
    {
        var borders = Standaard43Data.Load().Borders;

        Assert.Equal(84, borders.Count);
        Assert.Equal(60, borders.Count(border => border.Type == BorderType.Land));
        Assert.Equal(24, borders.Count(border => border.Type == BorderType.Sea));
    }

    [Fact]
    public void Kaart_Bevat_ZesContinenten_MetDeVastgesteldeBonussen()
    {
        var bonuses = Standaard43Data.Load().Continents
            .ToDictionary(continent => continent.Id, continent => continent.Bonus);

        Assert.Equal(6, bonuses.Count);
        Assert.Equal(5, bonuses["north-america"]);
        Assert.Equal(2, bonuses["south-america"]);
        Assert.Equal(5, bonuses["europe"]);
        Assert.Equal(3, bonuses["africa"]);
        Assert.Equal(7, bonuses["asia"]);
        Assert.Equal(3, bonuses["australia"]);
    }

    [Fact]
    public void Australie_HeeftVijfGebieden_InclusiefNieuwZeeland()
    {
        var australia = Standaard43Data.Load().Territories
            .Where(territory => territory.Continent == "australia")
            .Select(territory => territory.Id)
            .ToList();

        Assert.Equal(5, australia.Count);
        Assert.Contains("new-zealand", australia);
    }

    [Fact]
    public void Kaart_Bevat_ZevenSpelerskleuren_MetUniekeIds()
    {
        var colors = Standaard43Data.Load().Colors;

        Assert.Equal(7, colors.Count);
        Assert.Equal(colors.Count, colors.Select(color => color.Id).Distinct(StringComparer.Ordinal).Count());
    }

    [Fact]
    public void Setregels_KomenUitDeData()
    {
        var setRules = Standaard43Data.Load().SetRules;

        Assert.True(setRules.JokerIsWild);
        Assert.Equal(2, setRules.OwnedTerritoryBonus);
        Assert.Equal(["three-of-a-kind", "one-of-each"], setRules.ValidSets);
    }

    [Fact]
    public void ElkeParse_LevertEenOnafhankelijkeInstantie()
    {
        var eerste = Standaard43Data.Load();
        var tweede = Standaard43Data.Load();

        // Geen static of gedeelde cache: twee gelijktijdige spellen mogen elkaar niet raken.
        Assert.NotSame(eerste, tweede);
        Assert.NotSame(eerste.Adjacency, tweede.Adjacency);
    }
}
