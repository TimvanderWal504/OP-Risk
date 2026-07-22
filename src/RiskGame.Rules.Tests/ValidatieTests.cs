using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Elke validatieregel krijgt een eigen, minimaal databestandje. Dit is de reden dat de
/// parser strings aanneemt en geen bestandspaden: foutscenario's zijn zo te testen
/// zonder kapotte bestanden op schijf te zetten.
/// </summary>
public class ValidatieTests
{
    private const string GeldigeTerritories = """
        [
          { "id": "a", "name": "A", "continent": "c1", "centroid": [0, 0] },
          { "id": "b", "name": "B", "continent": "c1", "centroid": [1, 1] }
        ]
        """;

    private const string GeldigeAdjacency = """
        { "borders": [ { "from": "a", "to": "b", "type": "land" } ] }
        """;

    private const string GeldigeContinents = """
        { "continents": [ { "id": "c1", "name": "C1", "bonus": 2 } ] }
        """;

    private const string GeldigeColors = """
        { "colors": [ { "id": "red", "name": "Rood", "hex": "#C0392B", "symbol": "circle" } ] }
        """;

    private const string GeldigeCards = """
        {
          "themes": { "classic": { "symbol-1": "Infanterie", "joker": "Joker" } },
          "setRules": { "validSets": ["three-of-a-kind"], "jokerIsWild": true, "ownedTerritoryBonus": 2 },
          "deck": { "symbols": ["symbol-1"], "jokerCount": 2 }
        }
        """;

    private static Result Parse(
        string? territories = null,
        string? adjacency = null,
        string? continents = null,
        string? colors = null,
        string? cards = null)
    {
        var result = MapDefinitionParser.Parse("test", new MapDataSources(
            territories ?? GeldigeTerritories,
            adjacency ?? GeldigeAdjacency,
            continents ?? GeldigeContinents,
            colors ?? GeldigeColors,
            cards ?? GeldigeCards));

        return new Result(result.IsSuccess, result.Errors);
    }

    private sealed record Result(bool IsSuccess, IReadOnlyList<string> Errors)
    {
        public void AssertFailure(string expectedFragment)
        {
            Assert.False(IsSuccess, "Verwachtte een datafout, maar het inlezen slaagde.");
            Assert.Contains(
                Errors,
                error => error.Contains(expectedFragment, StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public void MinimaleGeldigeData_WordtGeaccepteerd()
    {
        Assert.True(Parse().IsSuccess);
    }

    [Fact]
    public void OngeldigeJson_LevertEenLeesbareFout()
    {
        Parse(territories: "{ dit is geen json").AssertFailure("ongeldige JSON");
    }

    [Fact]
    public void LeegBestand_LevertEenFout()
    {
        Parse(colors: "   ").AssertFailure("leeg");
    }

    [Fact]
    public void GebiedMetOnbekendContinent_IsOngeldig()
    {
        const string territories = """
            [
              { "id": "a", "name": "A", "continent": "c1", "centroid": [0, 0] },
              { "id": "b", "name": "B", "continent": "bestaat-niet", "centroid": [1, 1] }
            ]
            """;

        Parse(territories: territories).AssertFailure("onbekend continent");
    }

    [Fact]
    public void ContinentZonderGebieden_IsOngeldig()
    {
        const string continents = """
            {
              "continents": [
                { "id": "c1", "name": "C1", "bonus": 2 },
                { "id": "leeg", "name": "Leeg", "bonus": 5 }
              ]
            }
            """;

        Parse(continents: continents).AssertFailure("heeft geen enkel gebied");
    }

    [Fact]
    public void GrensNaarOnbekendGebied_IsOngeldig()
    {
        const string adjacency = """
            { "borders": [ { "from": "a", "to": "atlantis", "type": "sea" } ] }
            """;

        Parse(adjacency: adjacency).AssertFailure("onbekend gebied");
    }

    [Fact]
    public void GebiedDatAanZichzelfGrenst_IsOngeldig()
    {
        const string adjacency = """
            {
              "borders": [
                { "from": "a", "to": "b", "type": "land" },
                { "from": "a", "to": "a", "type": "land" }
              ]
            }
            """;

        Parse(adjacency: adjacency).AssertFailure("grenst aan zichzelf");
    }

    [Fact]
    public void DubbeleGrens_IsOngeldig()
    {
        const string adjacency = """
            {
              "borders": [
                { "from": "a", "to": "b", "type": "land" },
                { "from": "b", "to": "a", "type": "sea" }
              ]
            }
            """;

        Parse(adjacency: adjacency).AssertFailure("meer dan één keer");
    }

    [Fact]
    public void OnbekendGrenstype_IsOngeldig()
    {
        const string adjacency = """
            { "borders": [ { "from": "a", "to": "b", "type": "lucht" } ] }
            """;

        Parse(adjacency: adjacency).AssertFailure("onbekend type");
    }

    [Fact]
    public void DubbelGebiedId_IsOngeldig()
    {
        const string territories = """
            [
              { "id": "a", "name": "A", "continent": "c1", "centroid": [0, 0] },
              { "id": "b", "name": "B", "continent": "c1", "centroid": [1, 1] },
              { "id": "a", "name": "A nogmaals", "continent": "c1", "centroid": [2, 2] }
            ]
            """;

        Parse(territories: territories).AssertFailure("gebied-id 'a' komt meer dan één keer voor");
    }

    [Fact]
    public void DubbelKleurId_IsOngeldig()
    {
        const string colors = """
            {
              "colors": [
                { "id": "red", "name": "Rood", "hex": "#C0392B", "symbol": "circle" },
                { "id": "red", "name": "Ook rood", "hex": "#FF0000", "symbol": "square" }
              ]
            }
            """;

        Parse(colors: colors).AssertFailure("kleur-id 'red' komt meer dan één keer voor");
    }

    [Fact]
    public void LosgekoppeldGebied_IsOngeldig()
    {
        const string territories = """
            [
              { "id": "a", "name": "A", "continent": "c1", "centroid": [0, 0] },
              { "id": "b", "name": "B", "continent": "c1", "centroid": [1, 1] },
              { "id": "eiland", "name": "Eiland", "continent": "c1", "centroid": [2, 2] }
            ]
            """;

        Parse(territories: territories).AssertFailure("losgekoppeld: eiland");
    }

    [Fact]
    public void DeckZonderSymbolen_IsOngeldig()
    {
        const string cards = """
            {
              "themes": {},
              "setRules": { "validSets": [], "jokerIsWild": true, "ownedTerritoryBonus": 2 },
              "deck": { "symbols": [], "jokerCount": 2 }
            }
            """;

        Parse(cards: cards).AssertFailure("deck.symbols");
    }

    [Fact]
    public void AlleFoutenWordenVerzameld_NietAlleenDeEerste()
    {
        const string territories = """
            [
              { "id": "a", "name": "A", "continent": "onbekend-1", "centroid": [0, 0] },
              { "id": "b", "name": "B", "continent": "onbekend-2", "centroid": [1, 1] }
            ]
            """;

        var result = Parse(territories: territories);

        Assert.False(result.IsSuccess);
        Assert.True(result.Errors.Count > 1, "Verwachtte meerdere fouten, kreeg: " + string.Join(" | ", result.Errors));
    }
}
