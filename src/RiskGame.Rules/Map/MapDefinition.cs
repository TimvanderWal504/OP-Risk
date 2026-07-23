using System.Collections.Frozen;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Roles;

namespace RiskGame.Rules.Map;

/// <summary>
/// De volledige, gevalideerde statische data van één kaartvariant.
/// Er is bewust geen static of gedeelde cache: elke aanroep van
/// <see cref="MapDefinitionParser.Parse"/> levert een nieuwe, onafhankelijke instantie,
/// zodat twee gelijktijdige spellen met verschillende varianten elkaar niet raken.
/// </summary>
public sealed class MapDefinition
{
    private readonly FrozenDictionary<string, Territory> _territoriesById;
    private readonly FrozenDictionary<string, Continent> _continentsById;

    internal MapDefinition(
        string mapId,
        IReadOnlyList<Territory> territories,
        IReadOnlyList<Continent> continents,
        IReadOnlyList<PlayerColor> colors,
        IReadOnlyList<Border> borders,
        IReadOnlyList<Card> deck,
        CardSetRules setRules,
        IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> themes,
        IReadOnlyList<MissionDefinition> missions,
        IReadOnlyList<EventDefinition> events,
        IReadOnlyList<RoleDefinition> roles)
    {
        MapId = mapId;
        Territories = territories;
        Continents = continents;
        Colors = colors;
        Borders = borders;
        Deck = deck;
        SetRules = setRules;
        Themes = themes;
        Missions = missions;
        Events = events;
        Roles = roles;
        Adjacency = new AdjacencyGraph(borders);

        _territoriesById = territories.ToFrozenDictionary(
            territory => territory.Id, StringComparer.Ordinal);
        _continentsById = continents.ToFrozenDictionary(
            continent => continent.Id, StringComparer.Ordinal);
    }

    public string MapId { get; }

    public IReadOnlyList<Territory> Territories { get; }

    public IReadOnlyList<Continent> Continents { get; }

    public IReadOnlyList<PlayerColor> Colors { get; }

    public IReadOnlyList<Border> Borders { get; }

    /// <summary>Afgeleid uit <see cref="Territories"/>, niet ingelezen (FO §4.4).</summary>
    public IReadOnlyList<Card> Deck { get; }

    public CardSetRules SetRules { get; }

    /// <summary>Weergavenamen per thema, bijvoorbeeld classic en modern.</summary>
    public IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> Themes { get; }

    /// <summary>Geheime missies uit deze variant (FO §6.1).</summary>
    public IReadOnlyList<MissionDefinition> Missions { get; }

    /// <summary>Gebeurteniskaarten uit deze variant (FO §9.2).</summary>
    public IReadOnlyList<EventDefinition> Events { get; }

    /// <summary>
    /// Rollen die op deze variant toewijsbaar zijn (FO §8): alleen rollen waarvan het
    /// herkomstland op deze kaart bestaat. Rollen voor niet-bestaande gebieden zijn eruit
    /// gefilterd, niet geladen.
    /// </summary>
    public IReadOnlyList<RoleDefinition> Roles { get; }

    public AdjacencyGraph Adjacency { get; }

    public Territory Territory(string territoryId) => _territoriesById[territoryId];

    public Continent Continent(string continentId) => _continentsById[continentId];

    public bool HasTerritory(string territoryId) => _territoriesById.ContainsKey(territoryId);
}
