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

    // De minimale kaart heeft alleen kleur 'red'; de missieset dekt die met één eliminate-red
    // plus de bijbehorende fallback-missie (FO §6.1).
    private const string GeldigeMissions = """
        {
          "missions": [
            {
              "id": "territory-2",
              "type": "TerritoryCount",
              "params": { "count": 2 },
              "name": "Bezit 2 gebieden",
              "description": "Bezit 2 gebieden."
            },
            {
              "id": "eliminate-red",
              "type": "EliminatePlayer",
              "params": { "targetColor": "red" },
              "fallbackMissionId": "territory-2",
              "name": "Schakel rood uit",
              "description": "Vernietig rood."
            }
          ]
        }
        """;

    private const string GeldigeEvents = """
        {
          "events": [
            {
              "id": "babyboom",
              "name": "Babyboom",
              "description": "+2 legers.",
              "effect": { "type": "FreeReinforcement", "params": { "amount": 2 } },
              "duration": "instant"
            },
            {
              "id": "poolstorm",
              "name": "Poolstorm",
              "description": "A afgesloten.",
              "effect": { "type": "TerritoryLocked", "params": { "territoryIds": ["a"] } },
              "duration": "oneRound"
            }
          ]
        }
        """;

    private const string GeldigeRoles = """
        {
          "roles": [
            {
              "id": "president",
              "name": "President",
              "originTerritory": "a",
              "effect": { "type": "ExtraReinforcement", "params": { "amount": 1 } },
              "description": "+1 leger."
            }
          ]
        }
        """;

    private static Result Parse(
        string? territories = null,
        string? adjacency = null,
        string? continents = null,
        string? colors = null,
        string? cards = null,
        string? missions = null,
        string? events = null,
        string? roles = null)
    {
        var result = MapDefinitionParser.Parse("test", new MapDataSources(
            territories ?? GeldigeTerritories,
            adjacency ?? GeldigeAdjacency,
            continents ?? GeldigeContinents,
            colors ?? GeldigeColors,
            cards ?? GeldigeCards,
            missions ?? GeldigeMissions,
            events ?? GeldigeEvents,
            roles ?? GeldigeRoles));

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

    [Fact]
    public void MissieMetOnbekendContinent_IsOngeldig()
    {
        const string missions = """
            {
              "missions": [
                {
                  "id": "m1",
                  "type": "ConquerContinents",
                  "params": { "continents": ["bestaat-niet"], "extraAnyContinent": false },
                  "name": "M1",
                  "description": "D"
                },
                {
                  "id": "eliminate-red",
                  "type": "EliminatePlayer",
                  "params": { "targetColor": "red" },
                  "fallbackMissionId": "m1",
                  "name": "Eliminate red",
                  "description": "D"
                }
              ]
            }
            """;

        Parse(missions: missions).AssertFailure("onbekend continent");
    }

    [Fact]
    public void EliminatePlayerMissieMetOnbekendeKleur_IsOngeldig()
    {
        const string missions = """
            {
              "missions": [
                {
                  "id": "territory-2",
                  "type": "TerritoryCount",
                  "params": { "count": 2 },
                  "name": "T",
                  "description": "D"
                },
                {
                  "id": "eliminate-groen",
                  "type": "EliminatePlayer",
                  "params": { "targetColor": "green" },
                  "fallbackMissionId": "territory-2",
                  "name": "Eliminate groen",
                  "description": "D"
                }
              ]
            }
            """;

        Parse(missions: missions).AssertFailure("onbekende kleur");
    }

    [Fact]
    public void EliminatePlayerMissieMetOnbekendeFallback_IsOngeldig()
    {
        const string missions = """
            {
              "missions": [
                {
                  "id": "eliminate-red",
                  "type": "EliminatePlayer",
                  "params": { "targetColor": "red" },
                  "fallbackMissionId": "bestaat-niet",
                  "name": "Eliminate red",
                  "description": "D"
                }
              ]
            }
            """;

        Parse(missions: missions).AssertFailure("onbekende fallbackMissionId");
    }

    [Fact]
    public void MissiesetZonderEliminateVoorAlleKleuren_IsOngeldig()
    {
        const string colors = """
            {
              "colors": [
                { "id": "red", "name": "Rood", "hex": "#C0392B", "symbol": "circle" },
                { "id": "blue", "name": "Blauw", "hex": "#215C9C", "symbol": "square" }
              ]
            }
            """;

        // GeldigeMissions dekt alleen 'red', niet 'blue'.
        Parse(colors: colors).AssertFailure("niet dekkend");
    }

    [Fact]
    public void GebeurtenisMetOnbekendGebied_IsOngeldig()
    {
        const string events = """
            { "events": [
                {
                  "id": "e1",
                  "name": "E1",
                  "description": "D",
                  "effect": { "type": "TerritoryLocked", "params": { "territoryIds": ["atlantis"] } },
                  "duration": "oneRound"
                }
              ]
            }
            """;

        Parse(events: events).AssertFailure("onbekend gebied");
    }

    [Fact]
    public void GebeurtenisMetZeerouteDieGeenZeeverbindingIs_IsOngeldig()
    {
        const string events = """
            { "events": [
                {
                  "id": "e1",
                  "name": "E1",
                  "description": "D",
                  "effect": { "type": "SeaRoutesBlocked", "params": { "routes": [ { "from": "a", "to": "b" } ] } },
                  "duration": "oneRound"
                }
              ]
            }
            """;

        // GeldigeAdjacency verbindt a-b als 'land', niet als 'sea'.
        Parse(events: events).AssertFailure("geen zeeverbinding");
    }

    [Fact]
    public void GebeurtenisMetArmyAttritionEnOneRoundDuration_IsOngeldig()
    {
        const string events = """
            { "events": [
                {
                  "id": "e1",
                  "name": "E1",
                  "description": "D",
                  "effect": { "type": "ArmyAttrition", "params": { "amount": 2 } },
                  "duration": "oneRound"
                }
              ]
            }
            """;

        Parse(events: events).AssertFailure("instant");
    }

    [Fact]
    public void RolMetHerkomstlandBuitenDeKaart_WordtStilGefilterd()
    {
        const string roles = """
            {
              "roles": [
                {
                  "id": "president",
                  "name": "President",
                  "originTerritory": "bestaat-niet",
                  "effect": { "type": "ExtraReinforcement", "params": { "amount": 1 } },
                  "description": "D"
                }
              ]
            }
            """;

        // Geen datafout (FO: rollen zonder herkomstland op de kaart horen niet in de pool).
        var result = MapDefinitionParser.Parse("test", new MapDataSources(
            GeldigeTerritories, GeldigeAdjacency, GeldigeContinents, GeldigeColors, GeldigeCards,
            GeldigeMissions, GeldigeEvents, roles));

        Assert.True(result.IsSuccess, string.Join(" | ", result.Errors));
        Assert.Empty(result.Value.Roles);
    }

    [Fact]
    public void TweeRollenMetHetzelfdeHerkomstland_IsOngeldig()
    {
        const string roles = """
            {
              "roles": [
                {
                  "id": "president",
                  "name": "President",
                  "originTerritory": "a",
                  "effect": { "type": "ExtraReinforcement", "params": { "amount": 1 } },
                  "description": "D"
                },
                {
                  "id": "generaal",
                  "name": "Generaal",
                  "originTerritory": "a",
                  "effect": { "type": "Reroll", "params": { "perTurn": 1 } },
                  "description": "D"
                }
              ]
            }
            """;

        Parse(roles: roles).AssertFailure("herkomstland 'a' komt meer dan één keer voor");
    }
}
