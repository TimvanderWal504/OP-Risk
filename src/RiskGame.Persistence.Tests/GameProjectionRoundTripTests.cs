using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Projections;
using RiskGame.Persistence.Store;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Tests;

/// <summary>
/// Bewijst de herstel-garantie uit TO §9: append events → de live, inline-geprojecteerde
/// <see cref="GameState"/> (wat een client na een commando te zien krijgt) moet identiek
/// zijn aan een onafhankelijk vanaf de rauwe events opnieuw opgebouwde projectie (wat een
/// crash-herstel of reconnect zou opleveren, FO §11.1).
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameProjectionRoundTripTests(PostgresFixture postgres)
{
    private static readonly string MapsRoot =
        Path.Combine(AppContext.BaseDirectory, "data", "maps");

    private static readonly GameSettings Settings = new(
        WinCondition.SecretMissions,
        SetupMode.Random,
        StartingArmies: 25,
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentMode.Random,
        EventsEnabled: false);

    [Fact]
    public async Task LiveProjectieEnReplayVanuitRuweEvents_LeverenIdentiekeGameStateOp()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);
        await using var session = store.LightweightSession();

        session.Events.StartStream<GameState>(
            gameId,
            new GameCreated(gameId, "standaard-43", Settings),
            new PlayerJoined(gameId, "p1", "Alice"),
            new ColorChosen(gameId, "p1", "red"),
            new PlayerJoined(gameId, "p2", "Bob"),
            new ColorChosen(gameId, "p2", "blue"));

        await session.SaveChangesAsync();

        var live = await session.LoadAsync<GameState>(gameId);
        var replayed = await ReplayFromRawEventsAsync(session, gameId, mapSource);

        Assert.NotNull(live);
        Assert.NotNull(replayed);

        AssertIdenticalGameState(live!, replayed!);
    }

    /// <summary>
    /// Bouwt de projectie onafhankelijk van Martens opgeslagen snapshot opnieuw op, puur
    /// vanuit de rauwe events — dit is de herstel-garantie zelf (TO §9), niet een kopie van
    /// wat er al in de database staat.
    /// </summary>
    private static async Task<GameState> ReplayFromRawEventsAsync(
        Marten.IDocumentSession session, string gameId, IMapDefinitionSource mapSource)
    {
        var rawEvents = await session.Events.FetchStreamAsync(gameId);
        var projection = new GameProjection(mapSource);

        GameState? state = null;

        foreach (var @event in rawEvents)
        {
            state = @event.Data switch
            {
                GameCreated created => projection.Create(created),
                PlayerJoined joined => projection.Apply(state!, joined),
                ColorChosen chosen => projection.Apply(state!, chosen),
                var unexpected => throw new InvalidOperationException(
                    $"Onbekend event-type in de teststream: {unexpected.GetType()}"),
            };
        }

        return state ?? throw new InvalidOperationException("Geen events gevonden om te herspelen.");
    }

    /// <remarks>
    /// <see cref="Player"/> en <see cref="DeckState"/> hebben zelf een lijst-property
    /// (<c>Hand</c>, resp. <c>DrawPile</c>/<c>DiscardPile</c>). De record-gegenereerde
    /// <c>Equals</c> daarvan vergelijkt zo'n lijst niet inhoudelijk maar via
    /// <c>object.Equals</c> (arrays/lijsten overschrijven die niet) — twee inhoudelijk
    /// gelijke maar apart opgebouwde lege lijsten (hier: JSON-deserialisatie levert een
    /// <c>List&lt;Card&gt;</c>, in-memory een <c>Card[]</c>) tellen dan als ongelijk. Daarom
    /// hier per veld vergelijken in plaats van in één keer op het record: zo doet xUnit de
    /// inhoudelijke lijstvergelijking zelf, in plaats van te stuiten op die shortcut.
    /// </remarks>
    private static void AssertIdenticalGameState(GameState expected, GameState actual)
    {
        Assert.Equal(expected.GameId, actual.GameId);
        Assert.Equal(expected.Phase, actual.Phase);
        Assert.Equal(expected.Settings, actual.Settings);
        Assert.Equal(expected.Territories, actual.Territories);
        Assert.Equal(expected.TurnOrder, actual.TurnOrder);
        Assert.Equal(expected.TurnState, actual.TurnState);
        Assert.Equal(expected.ActiveEffects, actual.ActiveEffects);

        Assert.Equal(expected.Deck.NextTradeValue, actual.Deck.NextTradeValue);
        Assert.Equal(expected.Deck.DrawPile, actual.Deck.DrawPile);
        Assert.Equal(expected.Deck.DiscardPile, actual.Deck.DiscardPile);

        Assert.Equal(expected.Players.Count, actual.Players.Count);
        foreach (var (expectedPlayer, actualPlayer) in expected.Players.Zip(actual.Players))
        {
            Assert.Equal(expectedPlayer.Id, actualPlayer.Id);
            Assert.Equal(expectedPlayer.Name, actualPlayer.Name);
            Assert.Equal(expectedPlayer.ColorId, actualPlayer.ColorId);
            Assert.Equal(expectedPlayer.Hand, actualPlayer.Hand);
            Assert.Equal(expectedPlayer.RoleId, actualPlayer.RoleId);
            Assert.Equal(expectedPlayer.Mission, actualPlayer.Mission);
            Assert.Equal(expectedPlayer.IsEliminated, actualPlayer.IsEliminated);
            Assert.Equal(expectedPlayer.IsAutoPass, actualPlayer.IsAutoPass);
        }

        Assert.Equal(expected.Map.MapId, actual.Map.MapId);
        Assert.Equal(expected.Map.Territories, actual.Map.Territories);
        Assert.Equal(expected.Map.Continents, actual.Map.Continents);
        Assert.Equal(expected.Map.Colors, actual.Map.Colors);
        Assert.Equal(expected.Map.Borders, actual.Map.Borders);
        Assert.Equal(expected.Map.Deck, actual.Map.Deck);
        Assert.Equal(expected.Map.Roles, actual.Map.Roles);
        Assert.Equal(expected.Map.Adjacency, actual.Map.Adjacency);
    }
}
