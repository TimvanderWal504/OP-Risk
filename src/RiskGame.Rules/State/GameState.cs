using System.Collections.Frozen;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;

namespace RiskGame.Rules.State;

/// <summary>
/// De geprojecteerde spelstate: het "nu" (TO §3.1). De bron van waarheid is de
/// event-stream; deze state is een projectie daarvan.
/// </summary>
/// <remarks>
/// Immutable: elke <c>With…</c> levert een nieuwe state op en laat de oude ongemoeid,
/// zodat een half doorgevoerde beurt niet kan bestaan. De lookups worden per instantie
/// opgebouwd, net als in <see cref="MapDefinition"/>, zonder gedeelde cache — twee
/// gelijktijdige spellen raken elkaar zo nooit.
/// </remarks>
public sealed class GameState
{
    private readonly FrozenDictionary<string, Player> _playersById;
    private readonly FrozenDictionary<string, TerritoryOwnership> _territoriesById;

    public GameState(
        string gameId,
        MapDefinition map,
        GamePhase phase,
        GameSettings settings,
        IReadOnlyList<Player> players,
        IReadOnlyList<TerritoryOwnership> territories,
        IReadOnlyList<string> turnOrder,
        TurnState? turnState,
        DeckState deck,
        IReadOnlyList<ActiveEffect> activeEffects)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(gameId);
        ArgumentNullException.ThrowIfNull(map);
        ArgumentNullException.ThrowIfNull(settings);
        ArgumentNullException.ThrowIfNull(players);
        ArgumentNullException.ThrowIfNull(territories);
        ArgumentNullException.ThrowIfNull(turnOrder);
        ArgumentNullException.ThrowIfNull(deck);
        ArgumentNullException.ThrowIfNull(activeEffects);

        GameId = gameId;
        Map = map;
        Phase = phase;
        Settings = settings;
        Players = players;
        Territories = territories;
        TurnOrder = turnOrder;
        TurnState = turnState;
        Deck = deck;
        ActiveEffects = activeEffects;

        _playersById = players.ToFrozenDictionary(player => player.Id, StringComparer.Ordinal);
        _territoriesById = territories.ToFrozenDictionary(
            territory => territory.TerritoryId, StringComparer.Ordinal);
    }

    public string GameId { get; }

    /// <summary>De statische data van de gekozen kaartvariant.</summary>
    public MapDefinition Map { get; }

    public GamePhase Phase { get; }

    public GameSettings Settings { get; }

    public IReadOnlyList<Player> Players { get; }

    public IReadOnlyList<TerritoryOwnership> Territories { get; }

    /// <summary>De spelersvolgorde zoals bepaald door de order-roll (FO §5.1).</summary>
    public IReadOnlyList<string> TurnOrder { get; }

    /// <summary>
    /// Null zolang er nog geen beurt in de klassieke zin loopt: in de lobby, tijdens de
    /// order-roll, en tijdens <see cref="GamePhase.Claiming"/>/<see cref="GamePhase.InitialPlacement"/>
    /// (<see cref="TurnPhase"/> kent bewust alleen Reinforce/Attack/Fortify, TO §4.1). Wie
    /// er in die setup-fases aan zet is, wordt afgeleid uit <see cref="TurnOrder"/> plus
    /// voortgang (aantal geclaimde gebieden / geplaatste startlegers) in plaats van apart
    /// opgeslagen — dezelfde reden als bij <see cref="PlayerStatus"/>: geen tweede bron van
    /// waarheid die ermee uit de pas kan lopen.
    /// </summary>
    public TurnState? TurnState { get; }

    public DeckState Deck { get; }

    public IReadOnlyList<ActiveEffect> ActiveEffects { get; }

    public bool HasPlayer(string playerId) => _playersById.ContainsKey(playerId);

    public Player Player(string playerId) => _playersById[playerId];

    public bool HasTerritory(string territoryId) => _territoriesById.ContainsKey(territoryId);

    public TerritoryOwnership Territory(string territoryId) => _territoriesById[territoryId];

    public IEnumerable<TerritoryOwnership> TerritoriesOf(string playerId) =>
        Territories.Where(territory => territory.OwnerPlayerId == playerId);

    /// <summary>Of <paramref name="playerId"/> alle gebieden van <paramref name="continentId"/> bezit.</summary>
    public bool OwnsEntireContinent(string playerId, string continentId) =>
        Map.Territories
            .Where(territory => territory.Continent == continentId)
            .All(territory => Territory(territory.Id).OwnerPlayerId == playerId);

    /// <summary>
    /// De toestand van een speler, afgeleid uit de opgeslagen feiten in plaats van
    /// apart bijgehouden. Volgorde van precedentie: uitgeschakeld gaat vóór afwezig, en
    /// beide gaan vóór "aan de beurt" — een uitgeschakelde speler is nooit
    /// <see cref="PlayerStatus.Active"/>, ook niet als hij nog als actieve speler
    /// genoteerd staat.
    /// </summary>
    public PlayerStatus StatusOf(string playerId)
    {
        var player = Player(playerId);

        if (player.IsEliminated)
        {
            return PlayerStatus.Eliminated;
        }

        if (player.IsAutoPass)
        {
            return PlayerStatus.AutoPass;
        }

        return TurnState?.ActivePlayerId == playerId
            ? PlayerStatus.Active
            : PlayerStatus.Waiting;
    }

    public GameState WithPhase(GamePhase phase) => With(phase: phase);

    /// <summary>
    /// Zet of wist de beurt. Bewust niet via de gedeelde <c>With</c>-helper: die gebruikt
    /// null als "niet meegegeven", en hier is null juist een betekenisvolle waarde
    /// (terug naar de lobby, of einde spel).
    /// </summary>
    public GameState WithTurnState(TurnState? turnState) =>
        new(GameId,
            Map,
            Phase,
            Settings,
            Players,
            Territories,
            TurnOrder,
            turnState,
            Deck,
            ActiveEffects);

    public GameState WithDeck(DeckState deck) => With(deck: deck);

    public GameState WithTurnOrder(IReadOnlyList<string> turnOrder) => With(turnOrder: turnOrder);

    public GameState WithActiveEffects(IReadOnlyList<ActiveEffect> activeEffects) =>
        With(activeEffects: activeEffects);

    /// <summary>
    /// Voegt een nieuwe speler toe, of vervangt een bestaande speler met hetzelfde
    /// <see cref="Player.Id"/>; de overige spelers blijven ongewijzigd.
    /// </summary>
    public GameState WithPlayer(Player player)
    {
        ArgumentNullException.ThrowIfNull(player);

        var players = _playersById.ContainsKey(player.Id)
            ? Replace(Players, player, existing => existing.Id == player.Id)
            : [.. Players, player];

        return With(players: players);
    }

    /// <summary>Vervangt het bezit van één gebied; de overige gebieden blijven ongewijzigd.</summary>
    public GameState WithTerritory(TerritoryOwnership territory)
    {
        ArgumentNullException.ThrowIfNull(territory);

        return With(territories: Replace(
            Territories, territory, existing => existing.TerritoryId == territory.TerritoryId));
    }

    private GameState With(
        GamePhase? phase = null,
        IReadOnlyList<Player>? players = null,
        IReadOnlyList<TerritoryOwnership>? territories = null,
        IReadOnlyList<string>? turnOrder = null,
        DeckState? deck = null,
        IReadOnlyList<ActiveEffect>? activeEffects = null) =>
        new(GameId,
            Map,
            phase ?? Phase,
            Settings,
            players ?? Players,
            territories ?? Territories,
            turnOrder ?? TurnOrder,
            TurnState,
            deck ?? Deck,
            activeEffects ?? ActiveEffects);

    /// <summary>
    /// Vervangt het enige element dat aan <paramref name="matches"/> voldoet, op zijn
    /// eigen plek in de lijst. Een niet-bestaand element is een bug in de aanroeper, geen
    /// regelfout, en levert daarom een exception.
    /// </summary>
    private static IReadOnlyList<T> Replace<T>(
        IReadOnlyList<T> items, T replacement, Func<T, bool> matches)
    {
        var index = -1;

        for (var i = 0; i < items.Count; i++)
        {
            if (matches(items[i]))
            {
                index = i;
                break;
            }
        }

        if (index < 0)
        {
            throw new InvalidOperationException(
                $"Geen bestaand element gevonden om te vervangen door '{replacement}'.");
        }

        var copy = items.ToArray();
        copy[index] = replacement;

        return copy;
    }
}
