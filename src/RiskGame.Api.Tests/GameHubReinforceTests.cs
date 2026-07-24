using System.Net.Http.Json;
using Marten;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst de TO §4-pijplijn voor <c>PlaceReinforcements</c> en <c>TradeInCards</c>
/// (FO §5.2) end-to-end, zelfde opzet als <see cref="GameHubSetupTests"/>. Kaarten komen er
/// nog niet via een hub-commando (<c>CardDrawn</c> hoort bij de aanvalsplak), dus deze tests
/// injecteren ze rechtstreeks in de event-stream.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubReinforceTests(PostgresFixture postgres)
{
    private const int StartingArmies = 25;

    private static readonly GameSettingsDto Settings = new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmies,
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    private WebApplicationFactory<Program> CreateFactory() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = postgres.ConnectionString,
                }));

            // Zelfde volgorde als GameHubSetupTests: 2 trekkingen voor SecretMissions, dan
            // wint Alice de order-roll altijd meteen, zodat TurnOrder vaststaat.
            builder.ConfigureServices(services =>
                services.AddSingleton<IRandomSource>(new SequenceRandomSource(0, 1, 6, 4, 3, 2)));
        });

    private static async Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client)
    {
        var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(client.BaseAddress!, "/hubs/game"), options =>
            {
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
            })
            .Build();

        await connection.StartAsync();

        return connection;
    }

    private static async Task<string> CreateGameAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    /// <summary>
    /// Zet een spel volledig op tot en met InitialPlacement (43 gebieden om en om vanaf
    /// Alice, daarna de resterende legerbudgetten bijplaatsen) zodat de beurt bij Alice in
    /// <c>Reinforce</c> terechtkomt — zelfde rekenwerk als
    /// <see cref="GameHubSetupTests.VolledigeStartopstelling_EindigtInProgress"/>.
    /// </summary>
    private static async Task<(string GameId, string AliceId, string BobId, string AliceTerritoryId, string BobTerritoryId, GameStateDto State)>
        SetUpToReinforceAsync(HubConnection connection, HttpClient client)
    {
        var gameId = await CreateGameAsync(client);

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, alice.PlayerId);
        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bob.PlayerId);

        var territoryIds = bobRoll.State.Territories.Select(territory => territory.TerritoryId).ToArray();
        var turnOrder = new[] { alice.PlayerId, bob.PlayerId };

        string? aliceTerritoryId = null;
        string? bobTerritoryId = null;
        GameStateDto latest = bobRoll.State;

        for (var i = 0; i < territoryIds.Length; i++)
        {
            var claimerId = turnOrder[i % turnOrder.Length];
            latest = await connection.InvokeAsync<GameStateDto>("ClaimTerritory", gameId, claimerId, territoryIds[i]);

            if (claimerId == alice.PlayerId)
            {
                aliceTerritoryId ??= territoryIds[i];
            }
            else
            {
                bobTerritoryId ??= territoryIds[i];
            }
        }

        // 43 gebieden, om en om vanaf Alice: Alice krijgt er 22 (budget 25-22=3), Bob 21
        // (budget 25-21=4) — zelfde verdeling als GameHubSetupTests.
        var placementOrder = new[]
        {
            alice.PlayerId, bob.PlayerId, alice.PlayerId, bob.PlayerId, alice.PlayerId, bob.PlayerId, bob.PlayerId,
        };

        foreach (var placerId in placementOrder)
        {
            var territoryId = placerId == alice.PlayerId ? aliceTerritoryId! : bobTerritoryId!;
            latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, placerId, territoryId);
        }

        return (gameId, alice.PlayerId, bob.PlayerId, aliceTerritoryId!, bobTerritoryId!, latest);
    }

    [Fact]
    public async Task VolledigeStartopstelling_LandtInReinforceMetPoolVoorAlice()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (_, aliceId, _, _, _, state) = await SetUpToReinforceAsync(connection, client);

        Assert.Equal(GamePhaseDto.InProgress, state.Phase);
        Assert.NotNull(state.TurnState);
        Assert.Equal(aliceId, state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhaseDto.Reinforce, state.TurnState.TurnPhase);
        // Alice bezit 22 gebieden: max(3, 22/3) = max(3, 7) = 7, geen continent compleet.
        Assert.Equal(7, state.TurnState.ArmiesRemaining);
    }

    [Fact]
    public async Task PlaceReinforcements_BinnenBudget_TeltLegersOpEnVerlaagtPool()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, _, aliceTerritoryId, _, state) = await SetUpToReinforceAsync(connection, client);
        var armyCountBefore = state.Territories.Single(t => t.TerritoryId == aliceTerritoryId).ArmyCount;

        var updated = await connection.InvokeAsync<GameStateDto>(
            "PlaceReinforcements", gameId, aliceId, aliceTerritoryId, 3);

        Assert.Equal(armyCountBefore + 3, updated.Territories.Single(t => t.TerritoryId == aliceTerritoryId).ArmyCount);
        Assert.Equal(4, updated.TurnState!.ArmiesRemaining);
    }

    [Fact]
    public async Task PlaceReinforcements_BovenBudget_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, _, aliceTerritoryId, _, _) = await SetUpToReinforceAsync(connection, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceReinforcements", gameId, aliceId, aliceTerritoryId, 8));

        Assert.Contains("over om te plaatsen", exception.Message);
    }

    [Fact]
    public async Task PlaceReinforcements_NietEigenGebied_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, _, _, bobTerritoryId, _) = await SetUpToReinforceAsync(connection, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceReinforcements", gameId, aliceId, bobTerritoryId, 1));

        Assert.Contains("niet van speler", exception.Message);
    }

    /// <summary>Haalt drie kaarten met hetzelfde symbool op uit het deck (three-of-a-kind).</summary>
    private static Card[] ThreeOfAKindFrom(IReadOnlyList<Card> deck) =>
        deck
            .Where(card => !card.IsJoker)
            .GroupBy(card => card.Symbol)
            .First(group => group.Count() >= 3)
            .Take(3)
            .ToArray();

    /// <summary>
    /// Bouwt een spel rechtstreeks op in de projectie-fase Reinforce, met de opgegeven
    /// handkaarten al bij de speler — <see cref="CardDrawn"/> vereist een gevulde
    /// <see cref="DeckState.DrawPile"/>, die pas bij de aanvalsplak aangesloten wordt
    /// (TO §5.2), dus deze tests bouwen de startsituatie rechtstreeks, net als
    /// <c>GameProjectionRoundTripTests.CardsTraded_Vouwt...</c> dat op vouwregel-niveau doet.
    /// </summary>
    private static async Task<string> SetUpDirectReinforceStateAsync(
        WebApplicationFactory<Program> factory, IReadOnlyList<Card> hand, int armiesRemaining)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmies,
            TurnTimer: TimeSpan.FromSeconds(Settings.TurnTimerSeconds),
            FortifyTimer: TimeSpan.FromSeconds(Settings.FortifyTimerSeconds),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var player = new Player(
            "p1", "Alice", "red", Hand: hand,
            RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(
                territory.Id,
                OwnerPlayerId: territory.Id == "alaska" ? "p1" : null,
                ArmyCount: territory.Id == "alaska" ? 1 : 0))
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players: [player],
            territories,
            turnOrder: ["p1"],
            turnState: new TurnState(
                "p1", TurnPhase.Reinforce, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null, armiesRemaining),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task TradeInCards_GeldigeSet_LevertVrijePoolOpDieDirectPlaatsbaarIs()
    {
        await using var factory = CreateFactory();
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var cards = ThreeOfAKindFrom(mapSource.Load("standaard-43").Deck);

        var gameId = await SetUpDirectReinforceStateAsync(factory, cards, armiesRemaining: 3);

        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var afterTrade = await connection.InvokeAsync<GameStateDto>(
            "TradeInCards", gameId, "p1", cards.Select(card => card.Id).ToArray());

        // Eerste inleg levert altijd 4 op (FO §4.4), ongeacht eventuele bezitsbonussen.
        Assert.Equal(3 + 4, afterTrade.TurnState!.ArmiesRemaining);

        var afterPlace = await connection.InvokeAsync<GameStateDto>(
            "PlaceReinforcements", gameId, "p1", "alaska", afterTrade.TurnState.ArmiesRemaining);

        Assert.Equal(0, afterPlace.TurnState!.ArmiesRemaining);
    }

    [Fact]
    public async Task TradeInCards_OngeldigeSet_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var deck = mapSource.Load("standaard-43").Deck;
        var symbolGroups = deck.Where(card => !card.IsJoker).GroupBy(card => card.Symbol).ToList();

        // Twee kaarten van hetzelfde symbool + één van een ander: geen drie gelijke, geen
        // drie verschillende — een ongeldige set.
        var invalidSet = symbolGroups[0].Take(2)
            .Concat(symbolGroups.First(group => group.Key != symbolGroups[0].Key).Take(1))
            .ToArray();

        var gameId = await SetUpDirectReinforceStateAsync(factory, invalidSet, armiesRemaining: 3);

        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>(
                "TradeInCards", gameId, "p1", invalidSet.Select(card => card.Id).ToArray()));

        Assert.Contains("geen geldige set", exception.Message);
    }
}
